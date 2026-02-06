// deno-lint-ignore-file no-explicit-any

import { MarkedOptions, Token, TokenizerExtension, Tokens, getDefaults, lexer, type MarkedToken } from 'npm:marked@^17.0.1';

type PmMark = {
	type: string;
	attrs?: Record<string, any>;
	[key: string]: any;
};

type PmNode = {
	type?: string;
	attrs?: Record<string, any>;
	content?: PmNode[];
	marks?: PmMark[];
	text?: string;
	[key: string]: any;
};

export type Extension = TokenizerExtension & {
	renderer: (token: Tokens.Generic) => Iterable<PmNode>;
};

export type RendererOptions = Omit<MarkedOptions, 'extensions'> & {
	extensions?: Extension[] | null;
};

export class PmRenderer {
	private options: MarkedOptions;
	private renderers = new Map<string, Extension['renderer']>;

	constructor(options?: RendererOptions) {
		const { extensions, ...rest } = options ?? {};
		const markedOptions = { ...getDefaults(), ...rest } as MarkedOptions;
		if (extensions) {
			markedOptions.extensions ??= {
				renderers: {},
				childTokens: {}
			};

			for (const extension of extensions) {
				markedOptions.extensions[extension.level] ??= [];
				markedOptions.extensions[extension.level]!.unshift(extension.tokenizer);
				if (extension.start) {
					if (extension.level === 'inline') {		
						markedOptions.extensions.startInline ??= [];
						markedOptions.extensions.startInline!.unshift(extension.start);
					} else if (extension.level === 'block') {		
						markedOptions.extensions.startBlock ??= [];
						markedOptions.extensions.startBlock!.unshift(extension.start);
					}
				}

				if (extension.childTokens) {
					markedOptions.extensions.childTokens[extension.name] = extension.childTokens;
				}

				this.renderers.set(extension.name, extension.renderer);
			}
		}

		this.options = markedOptions;
	}

	parseDocument(tokens: string | Token[]): PmNode {
		return { type: 'doc', content: [ ...this.parse(tokens) ] };
	}

	*parse(tokens: string | Token[]): Generator<PmNode> {
		if (typeof tokens === 'string') {
			tokens = lexer(tokens, this.options);
		}

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i] as MarkedToken;
			if (this.renderers.has(token.type)) {
				yield *this.renderers.get(token.type)!(token);
				continue;
			}

			switch (token.type) {
				case 'text':
					if ('tokens' in token) {
						for (const child of this.parse(token.tokens!)) {
							yield child;
						}
					} else {
						yield { type: 'text', text: token.text };
					}
					break;
				case 'strong':
					yield *this._emitWithMarks(token, [ { type: 'bold' } ]);
					break;
				case 'em':
					yield *this._emitWithMarks(token, [ { type: 'italic' } ]);
					break;
				case 'del':
					yield *this._emitWithMarks(token, [ { type: 'strikethrough' } ]);
					break;
				case 'paragraph': {
					const tokens = token.tokens;
					if (tokens.length === 1 && tokens[0].type === 'image') {
						yield *this.parse(tokens);
					} else {
						const content = [ ...this.parse(tokens) ];
						if (
							content.length === 1 &&
							content[0].type === 'text' &&
							(content[0].text === '&nbsp;' || content[0].text === '\xA0')
						) {
							yield { type: 'paragraph', content: [] }
						} else {
							yield { type: 'paragraph', content };
						}
					}
					break;
				}
				case 'space': {
					continue;
				}
				case 'list': {
					const content = [ ...this.parse(token.items) ];
					if (token.ordered) {
						yield { type: 'orderedList', content };
					} else {
						yield { type: 'bulletList', content };
					}
					break;
				}
				case 'list_item': {
					let content: PmNode[] = [];
					if (token.tokens?.length) {
						if (token.tokens.some(t => t.type === 'paragraph')) {
							content = [ ...this.parse(token.tokens) ];
						} else {
							const firstToken = token.tokens[0];
							if (firstToken && firstToken.type === 'text' && firstToken.tokens && firstToken.tokens.length > 0) {
								const inlineContent = [ ...this.parse(firstToken.tokens) ];
								content = [
									{
										type: 'paragraph',
										content: inlineContent
									}
								];

								if (token.tokens.length > 1) {
									const remainingTokens = token.tokens.slice(1);
									content.push(...this.parse(remainingTokens));
								}
							} else {
								content = [ ...this.parse(token.tokens) ];
							}
						}
					}

					if (content.length === 0) {
						content = [ { type: 'paragraph', content: [] } ];
					}

					yield { type: 'listItem', content };
					break;
				}
				case 'escape': // Used in LaTeX, best to emit as-is
				case 'html': // Not bothering
					yield { type: 'text', text: token.raw };
					break;
				case 'hr':
					yield { type: 'horizontalRule' };
					break;
				case 'link':
					yield *this._emitWithMarks(token, [
						{ type: 'link', attrs: { href: token.href, title: token.title || null } }
					]);
					break;
				case 'codespan':
					yield *this._emitWithMarks(token, [ { type: 'code' } ]);
					break;
				case 'code':
					yield {
						type: 'codeBlock',
						attrs: token.lang ? { language: token.lang } : undefined,
						content: [ { type: 'text', text: token.text } ]
					};
					break;
				case 'br':
					yield { type: 'hardBreak' };
					break;
				default:
					throw new TypeError(`Unhandled ${token.type}`);
			}
		}
	}

	*_emitWithMarks(token: Token, marks: PmMark[]): Generator<PmNode> {
		if ('tokens' in token) {
			for (const outToken of this.parse((token as Tokens.Text).tokens!)) {
				yield { ...outToken, marks: [ ...outToken?.marks ?? [], ...marks ] };
			}
		} else {
			yield { type: 'text', marks, text: (token as Tokens.Text).text };
		}
	}
}

export function parseDocument(text: string, options?: RendererOptions): PmNode {
	return (new PmRenderer(options)).parseDocument(text);
}

export const DEFAULT_CONTENT: PmNode = { type: 'doc', content: [] };

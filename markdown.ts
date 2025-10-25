// deno-lint-ignore-file no-explicit-any

import { MarkedOptions, Token, TokenizerExtension, Tokens, getDefaults, lexer } from 'npm:marked@^16.4.1';

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
			const token = tokens[i];
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
				case 'paragraph':
					yield { type: 'paragraph', content: [ ...this.parse(token.tokens!) ] };
					break;
				case 'space': {
					continue;
				}
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

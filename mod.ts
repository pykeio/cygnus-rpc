import * as ed from 'jsr:@noble/ed25519@3.0.0';
import { nanoid } from 'jsr:@sitnik/nanoid@5.1.5';
import { assert } from 'jsr:@std/assert@1.0.15';
import { concat as concatBytes } from 'jsr:@std/bytes@1.0.6';
import { decode } from 'jsr:@std/msgpack@1.0.3';

import type * as cy from './cy.d.ts';
import { RESPOND_SYMBOL, type Route } from './_internal.ts';
import { getLogger, type Logger } from './logging.ts';

export { cy };

export interface WorkerOptions {
	basePath?: string;
}

export default class CygnusWorker {
	readonly #publicKey: Uint8Array;
	readonly #routes = new Map<string, Route>();
	private readonly logger = getLogger('cygnus-worker');

	public constructor(publicKey: string | Uint8Array, private readonly options?: WorkerOptions) {
		if (typeof publicKey === 'string') {
			publicKey = ed.etc.hexToBytes(publicKey);
		}
		this.#publicKey = publicKey;

		if (options?.basePath) {
			if (!options.basePath.startsWith('/')) {
				options.basePath = `/${options.basePath}`;
			}
			if (!options.basePath.endsWith('/')) {
				options.basePath += '/';
			}
		}
	}

	public add(route: string, handler: Route): this {
		if (!route.startsWith('/')) {
			route = `/${route}`;
		}
		if (route.endsWith('/')) {
			route = route.slice(0, -1);
		}

		if (this.#routes.has(route)) {
			throw new TypeError(`Route '${route}' already defined`);
		}

		this.#routes.set(route, handler);

		return this;
	}

	private displayAddr(addr: Deno.Addr): string {
		switch (addr.transport) {
			case 'tcp':
			case 'udp':
				return `${addr.hostname}:${addr.port}`;
			case 'unix':
			case 'unixpacket':
				return `unix:${addr.path}`;
			case 'vsock':
				return `vs:${addr.cid}#${addr.port}`;
		}
	}

	private verify(body: Uint8Array, headers: Headers): Promise<boolean> {
		const [ signatureValue, timestampValue ] = [ headers.get('cygnus-rpc-signature'), headers.get('cygnus-rpc-timestamp') ];
		if (!signatureValue || !timestampValue) {
			return Promise.resolve(false);
		}

		const sig = ed.etc.hexToBytes(signatureValue);
		const bodyToVerify = concatBytes([ body, new TextEncoder().encode(timestampValue) ]);
		return ed.verifyAsync(sig, bodyToVerify, this.#publicKey);
	}

	private parseBody(body: Uint8Array): cy.RemoteCall {
		const parsed = decode(body);
		if (!parsed || typeof parsed !== 'object' || !('ev' in parsed)) {
			throw new TypeError('Invalid message body');
		}
		return parsed as unknown as cy.RemoteCall;
	}

	public serve(options?: Deno.ServeTcpOptions | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem)): Deno.HttpServer<Deno.NetAddr>;
	public serve(options?: Deno.ServeUnixOptions): Deno.HttpServer<Deno.UnixAddr>;
	public serve(options?: Deno.ServeTcpOptions & Deno.ServeUnixOptions): Deno.HttpServer {
		return Deno.serve(
			{
				onListen: addr => {
					this.logger.info(`Listening on ${this.displayAddr(addr)}`);
					options?.onListen?.(addr);
				},
				...options
			},
			async (req: Request, info: Deno.ServeHandlerInfo<Deno.Addr>) => {
				const url = new URL(req.url);
				let pathname = url.pathname;
				if (this.options?.basePath) {
					if (!pathname.startsWith(this.options.basePath)) {
						return new Response(null, { status: 404 });
					}

					// - 1 so we keep the leading slash.
					pathname = pathname.slice(this.options.basePath.length - 1);
				}

				const requestId = req.headers.get('Cygnus-Request-Id');
				const logger = this.logger.with({ pathname, requestId, addr: this.displayAddr(info.remoteAddr) });

				if (req.method !== 'POST') {
					logger.debug(`Received invalid request method '${req.method}'`);
					return new Response(null, { status: 405 });
				}

				const bytes = await req.bytes();
				if (!await this.verify(bytes, req.headers)) {
					try {
						// ping messages are very short, if we exceed this it's probably not a ping and we shouldn't even
						// bother to parse
						if (bytes.length > 128) {
							throw 1;
						}

						const body = this.parseBody(bytes);
						// only log if this isn't a ping event. ping events with invalid signatures are intentionally sent
						// to ensure the worker's signature check is working properly.
						if (body.ev !== 'cygnus:ping') {
							throw 1;
						}
					} catch {
						logger.warn(`Non-ping procedure call failed signature check`);
					}
					return new Response(null, { status: 401 });
				}
				
				let body: cy.RemoteCall;
				try {
					body = this.parseBody(bytes);
				} catch (e) {
					logger.error(`Invalid call body: ${(e as Error).message}`);
					return new Response(null, { status: 400 });
				}

				if (body.ev === 'cygnus:ping') {
					return new Response(null, { status: 204 });
				}

				const route = this.getRoute(pathname);
				if (!route) {
					logger.error(`Unknown route '${pathname}'`);
					return new Response(null, { status: 404 });
				}

				return await this.callRoute(route, body, logger);
			}
		);
	}

	private getRoute(pathname: string): Route | undefined {	
		let route = this.#routes.get(pathname);
		if (!route && pathname.endsWith('/')) {
			route = this.#routes.get(pathname.slice(0, -1));
		}
		return route;
	}

	private async callRoute(route: Route, body: cy.RemoteCall, logger: Logger = this.logger): Promise<Response> {
		if (body.ev !== route.event) {
			logger.warn(`Expected '${route.event}' event for this route, got '${body.ev}'`);
			return new Response(null, { status: 405 });
		}

		logger.info(`RPC @${body.ev} -> {pathname}`);

		const start = performance.now();
		let res: Response;
		try {
			res = await route[RESPOND_SYMBOL](body);
		} catch (e) {
			logger.warn(`Unhandled error: ${(e as Error).stack}`);
			return new Response(null, { status: 500 });
		}

		logger[res.status === 200 ? 'info' : 'warn'](
			`RPC @${body.ev} -> {pathname} - ${res.status === 200 ? 'OK' : 'ERR'} ${(performance.now() - start).toFixed(1)}ms`
		);
		return res;
	}

	public async test(pathname: string) {		
		const route = this.getRoute(pathname);
		if (!route) {
			throw new Error(`Unknown route '${pathname}'`);
		}

		let mode: 'oneshot' | 'streaming' = 'oneshot';
		let payload: cy.RemoteCall;
		switch (route.event) {
			case 'demonstration:synthesize':
				mode = 'streaming';
				payload = {
					ev: 'demonstration:synthesize',
					initiator: { id: nanoid(20) },
					synthesizer: 'any',
					creativity: 3,
					demonstration: {
						id: nanoid(18),
						type: 'EXPERIMENT',
						content: { version: 1 }
					},
				};
				break;
			case 'task:seed':
				payload = {
					ev: 'task:seed',
					initiator: { id: nanoid(20) },
					source: { init: 'FREE', type: 'EXPERIMENT' }
				};
				break;
			default:
				throw new Error();
		}

		const res = await this.callRoute(route, payload, this.logger.with({ pathname }));
		if (res.status !== 200) {
			throw new Error(`Got response code ${res.status}`);
		}

		switch (mode) {
			case 'oneshot':
				console.log(decode(await res.bytes()));
				break;
			case 'streaming': {
				for await (const x of res.body!) {
					const view = new DataView(x.buffer);
					const length = view.getUint32(0, true);
					assert(4 + length === x.byteLength);

					const data = decode(x.slice(4));
					console.log(data);
				}
			}
		}
	}
}

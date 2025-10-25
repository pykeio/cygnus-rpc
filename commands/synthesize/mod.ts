import { concat as concatBytes } from 'jsr:@std/bytes@1.0.6';
import { encode } from 'jsr:@std/msgpack@1.0.3';

import { RESPOND_SYMBOL, type Route } from '../../_internal.ts';
import type { cy } from '../../mod.ts';

export type SynthesizeRequest = Omit<cy.RemoteSynthesisCall, 'ev'>;

export default abstract class AbstractSynthesizeCallHandler implements Route {
	public abstract synthesize(req: SynthesizeRequest, abortSignal?: AbortSignal): AsyncGenerator<cy.RemoteSynthesisEvent, void>;

	// deno-lint-ignore no-explicit-any
	protected encode(value: any): Uint8Array {
		const encoded = encode(value);
		const length = new DataView(new ArrayBuffer(4));
		length.setUint32(0, encoded.length, true);
		return concatBytes([ new Uint8Array(length.buffer), encoded ]);
	}

	public readonly event = 'demonstration:synthesize';
	// deno-lint-ignore require-await
	public async [RESPOND_SYMBOL](req: cy.RemoteSynthesisCall): Promise<Response> {
		const abortController = new AbortController();

		return new Response(new ReadableStream({
			type: 'bytes',
			start: async controller => {
				const gen = this.synthesize(req, abortController.signal);
				while (true) {
					if (abortController.signal.aborted) {
						break;
					}

					let next;
					try {
						next = await gen.next();
						if (next.done) {
							break;
						}
					} catch (e) {
						if (e instanceof Error && e.name === 'AbortError') {
							break;
						}

						controller.enqueue(this.encode({ ev: 'error', message: (e as Error).message } satisfies cy.RemoteSynthesisEvent));
						break;
					}

					controller.enqueue(this.encode(next.value));
				}

				abortController.abort();
				controller.close();
			},
			cancel() {
				abortController.abort();
			}
		}), {
			status: 200,
			headers: {
				'connection': 'keep-alive',
				'content-type': 'application/x-msgpack-stream',
				'cache-control': 'no-cache, no-transform',
				'x-accel-buffering': 'no'
			}
		});
	}
}

import { encode } from 'jsr:@std/msgpack@1.0.3';

import { RESPOND_SYMBOL, type Route } from '../_internal.ts';
import type { cy } from '../mod.ts';

export type FunctionCallRequest = Omit<cy.RemoteFunctionCall, 'ev'>;
export type FunctionCallResponse = cy.RemoteFunctionCallResponse;

export type FunctionCallSuccessResponse = Omit<cy.CyFunctionCallOutputV1 & { success: true }, 'success'> & { persist?: boolean };

export default abstract class AbstractFunctionCallHandler implements Route {
	public abstract generate(req: FunctionCallRequest): Promise<FunctionCallResponse>;

	public readonly event = 'functionCall';

	public async [RESPOND_SYMBOL](req: cy.RemoteFunctionCall): Promise<Response> {
		// deno-lint-ignore no-explicit-any
		return new Response(encode(await this.generate(req) as any), { status: 200 });
	}
}

export class SimpleFunctionCall extends AbstractFunctionCallHandler {
	public constructor(
		private readonly handler: (req: FunctionCallRequest) =>
			| FunctionCallResponse
			| FunctionCallSuccessResponse
			| Promise<FunctionCallResponse| FunctionCallSuccessResponse>
	) {
		super();
	}

	public override async generate(req: FunctionCallRequest): Promise<FunctionCallResponse> {
		try {
			const res = await this.handler(req);
			if (!('success' in res)) {
				return {
					output: {
						...(res as FunctionCallSuccessResponse),
						success: true
					// deno-lint-ignore no-explicit-any
					} as any,
					persist: res.persist ?? false
				};
			}
			return res as FunctionCallResponse;
		} catch (e) {
			if (e instanceof Error) {
				return {
					output: {
						success: false,
						error: e.message
					},
					persist: false
				};
			}

			throw e;
		}
	}
}

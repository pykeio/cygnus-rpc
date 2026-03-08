import { encode } from 'jsr:@std/msgpack@1.0.3';

import { RESPOND_SYMBOL, type Route } from '../_internal.ts';
import type { cy } from '../mod.ts';

export type SynthesisPreferenceCall = Omit<cy.RemoteSynthesisPreferenceCall, 'ev'>;

export default abstract class AbstractPreferenceCallHandler implements Route {
	public abstract record(req: SynthesisPreferenceCall): void | Promise<void>;

	public readonly event = 'synthesisPreference';

	public async [RESPOND_SYMBOL](req: cy.RemoteSynthesisPreferenceCall): Promise<Response> {
		await this.record(req);
		return new Response(encode(null), { status: 200 });
	}
}

export class SimplePreferenceHandler extends AbstractPreferenceCallHandler {
	public constructor(private readonly handler: (req: SynthesisPreferenceCall) => void | Promise<void>) {
		super();
	}

	public override record(req: SynthesisPreferenceCall): void | Promise<void> {
		return this.handler(req);
	}
}

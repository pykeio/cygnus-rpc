import { encode } from 'jsr:@std/msgpack@1.0.3';

import { RESPOND_SYMBOL, type Route } from '../_internal.ts';
import type { cy } from '../mod.ts';

export type SeedRequest = Omit<cy.RemoteTaskSeedCall, 'ev'>;
export type SeedResponse = cy.RemoteTaskSeedResponse;

export default abstract class AbstractSeedCallHandler implements Route {
	public abstract seed(req: SeedRequest): Promise<SeedResponse>;

	public readonly event = 'seed';

	public async [RESPOND_SYMBOL](req: cy.RemoteTaskSeedCall): Promise<Response> {
		// deno-lint-ignore no-explicit-any
		return new Response(encode(await this.seed(req) as any), { status: 200 });
	}
}

export class SimpleSeeder extends AbstractSeedCallHandler {
	public constructor(private readonly handler: (req: SeedRequest) => SeedResponse | Promise<SeedResponse>) {
		super();
	}

	public override async seed(req: SeedRequest): Promise<SeedResponse> {
		return await this.handler(req);
	}
}

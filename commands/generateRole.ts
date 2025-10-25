import { encode } from 'jsr:@std/msgpack@1.0.3';

import { RESPOND_SYMBOL, type Route } from '../_internal.ts';
import type { cy } from '../mod.ts';

export type RoleGenerationRequest = Omit<cy.RemoteRoleGenerationCall, 'ev'>;
export type RoleGenerationResponse = cy.RemoteRoleGenerationResponse;

export default abstract class AbstractRoleGenerationCallHandler implements Route {
	public abstract generate(req: RoleGenerationRequest): Promise<RoleGenerationResponse>;

	public readonly event = 'role:generate';

	public async [RESPOND_SYMBOL](req: cy.RemoteRoleGenerationCall): Promise<Response> {
		// deno-lint-ignore no-explicit-any
		return new Response(encode(await this.generate(req) as any), { status: 200 });
	}
}

export class SimpleRoleGenerator extends AbstractRoleGenerationCallHandler {
	public constructor(private readonly handler: (req: RoleGenerationRequest) => RoleGenerationResponse | Promise<RoleGenerationResponse>) {
		super();
	}

	public override async generate(req: RoleGenerationRequest): Promise<RoleGenerationResponse> {
		return await this.handler(req);
	}
}

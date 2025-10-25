import type { cy } from './mod.ts';

export const RESPOND_SYMBOL = Symbol('cy:respond');

export interface Route {
	readonly event: cy.RemoteCall['ev'];

	[RESPOND_SYMBOL](req: cy.RemoteCall): Promise<Response>;
}

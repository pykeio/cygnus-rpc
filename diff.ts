// deno-lint-ignore-file no-explicit-any

import { createStringDelta } from './_delta.ts';

export type Patch = {
	op: 'replace' | 'remove' | 'add' | 'delta';
	path: (string | number)[];
	value?: any;
};

function keys(x: any): string[] | number[] {
	if (Array.isArray(x)) {
		return new Array(x.length).fill(0).map((_, i) => i);
	}
	return Object.keys(x);
}

export default function *diff(x: any, y: any, path: (string | number)[] = []): Generator<Patch> {
	if (x === y) {
		return;
	}

	const [ xKeys, yKeys ] = [ keys(x), keys(y) ];
	const [ xIsArray, yIsArray ] = [ Array.isArray(x), Array.isArray(y) ];
	let deleted = false;

	for (const key of xKeys.reverse()) {
		const newPath = [ ...path, key ];
		const oldValue = x[key];
		if (Object.hasOwn(y, key) && !(y[key] === undefined && oldValue !== undefined && !xIsArray)) {
			const newValue = y[key];
			if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null && Array.isArray(oldValue) === Array.isArray(newValue)) {
				yield *diff(oldValue, newValue, newPath);
			} else if (oldValue !== newValue) {
				if (typeof oldValue === 'string' && typeof newValue === 'string' && newValue.length >= 64) {
					yield { op: 'delta', path: newPath, value: createStringDelta(oldValue, newValue) };
				} else {
					yield { op: 'replace', path: newPath, value: newValue };
				}
			}
		} else if (xIsArray === yIsArray) {
			yield { op: 'remove', path: newPath };
			deleted = true;
		} else {
			yield { op: 'replace', path, value: x };
		}
	}

	if (!deleted && yKeys.length === xKeys.length) {
		return;
	}

	for (const key of yKeys) {
		if (!Object.hasOwn(x, key) && y[key] !== undefined) {
			yield { op: 'add', path: [ ...path, key ], value: y[key] };
		}
	}
}

export class DiffTracker {
	constructor(private lastValue: any = {}) {}

	update(value: any): Patch[] {
		const patches = [ ...diff(this.lastValue, value) ];
		this.lastValue = value;
		return patches;
	}
}

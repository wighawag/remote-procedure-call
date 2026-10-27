import {CurriedRemoteCallType, RemoteRequestCallType, RPCMethods, RPCRequestData} from '../types';

/**
 * One `call` per method. A method whose entry is a UNION (one entry per parameter shape) gets
 * one curried function per entry, overloaded: see `MethodCall`.
 */
export type CurriedUnion<T extends RPCMethods> = {
	[Property in keyof T]: CurriedRemoteCallType<Property extends string ? Property : never, T[Property]>;
}[keyof T];

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type OnlyCurriedRPC<T extends RPCMethods> = UnionToIntersection<CurriedUnion<T>>;

/**
 * Builds ONE `request` signature per entry.
 *
 * `Entry` is a naked type parameter, so this conditional DISTRIBUTES over a union of entries. That
 * is what makes a method declared as
 *
 *     eth_getBlockByNumber:
 *       | {params: [tag, false?]; result: Block | null}
 *       | {params: [tag, true]; result: BlockWithTransactions | null}
 *
 * produce two real overloads instead of one signature whose result is the union of both. It is the
 * same machinery as `eip-1193`'s `RequestRPC` (0.7 and later), so a client typed with an eip-1193
 * method table is assignable to the matching eip-1193 provider type.
 */
type MethodRequestCallType<Method extends string, Entry> = Entry extends RPCRequestData
	? RemoteRequestCallType<
			Method,
			Entry extends {result: any} ? Entry['result'] : undefined,
			Entry extends {params: any} ? Entry['params'] : undefined
		>
	: never;

export type RequestUnion<T extends RPCMethods> = {
	[Property in keyof T]: MethodRequestCallType<Property extends string ? Property : never, T[Property]>;
}[keyof T];

/**
 * A `{request(...)}` object with one overload per method (one per entry for a union entry).
 *
 * There is no `request(req: {method: string; ...})` catch-all: it matched every call, so a typo
 * compiled, and every real mistake was reported against the catch-all instead of the method you
 * called. To call a method outside the table, extend the table, or use `callUnknown` on a curried
 * client.
 */
export type RequestRPC<T extends RPCMethods> = UnionToIntersection<RequestUnion<T>> & {
	// Diagnostic-only overload, deliberately LAST and deliberately unsatisfiable (`params: never`).
	// TypeScript reports the last overload when no overload matches, so this turns "No overload
	// matches this call" into a message that names the method you actually meant.
	request(req: {method: keyof T & string; params: never}): Promise<any>;
};

export type CurriedRPC<T extends RPCMethods> = OnlyCurriedRPC<T> & RequestRPC<T>;

/**
 * What a client can be created over, besides a URL: anything with an async `request`, which is the
 * only thing ever called on it. Method syntax, so any typed EIP-1193-style provider fits, whatever
 * method table it is typed with.
 */
export type RequestEndpoint = {
	request(args: {method: string; params?: any}): Promise<any>;
};

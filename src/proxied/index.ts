import PromiseThrottle from 'promise-throttle';
import type {RPCMethods} from '../types.js';
import type {ProxiedRPC} from './types.js';
import {call} from '../common/index.js';

/**
 * Creates a JSON-RPC proxy object that allows calling remote methods on the specified endpoint.
 *
 * @template Methods - The type representing the available JSON-RPC methods.
 * @param {string} endpoint - The URL of the JSON-RPC endpoint.
 * @param {Object} [options] - An optional object with additional options.
 * @param {number} [options.requestsPerSecond] - The maximum number of requests per second.
 * @returns {T} A proxy object that allows calling remote methods on the specified endpoint.
 */
export function createJSONRPC<T extends RPCMethods>(
	endpoint: string,
	options?: {requestsPerSecond?: number},
): ProxiedRPC<T> {
	const promiseThrottle =
		options?.requestsPerSecond !== undefined
			? new PromiseThrottle({
					requestsPerSecond: options.requestsPerSecond,
					promiseImplementation: Promise,
				})
			: null;
	const handler = {
		get(_target: unknown, prop: string, _receiver: unknown) {
			const method = prop;
			return <
				Method extends string,
				Value,
				Error = undefined,
				Params extends unknown[] | Record<string, unknown> | undefined = undefined,
			>(
				// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
				params: Params extends undefined ? void : Params,
			) => {
				if (promiseThrottle) {
					return promiseThrottle.add(call.bind(null, endpoint, {method, params}));
				}
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				return call<Method, Value, Error, Params>(endpoint, {method, params} as any);
			};
		},
	};
	return new Proxy({}, handler) as unknown as ProxiedRPC<T>;
}

import PromiseThrottle from 'promise-throttle';
import {Result, RPCMethods} from '../types';
import {call} from '../common';
import {ProxiedRPC} from './types';

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
		options?.requestsPerSecond != undefined
			? new PromiseThrottle({
					requestsPerSecond: options.requestsPerSecond,
					promiseImplementation: Promise,
				})
			: null;
	const handler = {
		get(_target: {}, prop: string, _receiver: {}) {
			const method = prop;
			return <
				Method extends string,
				Value,
				Error = undefined,
				Params extends any[] | Record<string, any> | undefined = undefined,
			>(
				params: Params extends undefined ? void : Params,
			) => {
				if (promiseThrottle) {
					return promiseThrottle.add(call.bind(null, endpoint, {method, params}));
				} else {
					return call<Method, Value, Error, Params>(endpoint, {method, params} as any);
				}
			};
		},
	};
	return new Proxy({}, handler) as unknown as ProxiedRPC<T>;
}

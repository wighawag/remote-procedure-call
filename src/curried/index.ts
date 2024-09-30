import PromiseThrottle from 'promise-throttle';
import type {Result, RPCMethods} from '../types.js';
import {call} from '../common/index.js';
import type {CurriedRPC} from './types.js';

class JSONRPC {
	private promiseThrottle: PromiseThrottle | undefined;
	constructor(
		protected endpoint: string,
		options?: {requestsPerSecond?: number},
	) {
		if (options?.requestsPerSecond) {
			this.promiseThrottle = new PromiseThrottle({
				requestsPerSecond: options.requestsPerSecond,
				promiseImplementation: Promise,
			});
		}
	}

	call<
		Method extends string,
		Value,
		Error = undefined,
		Params extends unknown[] | Record<string, unknown> | undefined = undefined,
		// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
		return (params: Params extends undefined ? void : Params) => {
			if (this.promiseThrottle) {
				return this.promiseThrottle.add(call.bind(null, this.endpoint, {method, params}));
			}
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			return call<Method, Value, Error, Params>(this.endpoint, {method, params} as any);
		};
	}

	callUnknown<
		Method extends string,
		Value,
		Error = undefined,
		Params extends unknown[] | Record<string, unknown> | undefined = undefined,
		// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		return this.call(method);
	}
}
/**
 * Creates a JSON-RPC client instance with optional rate limiting.
 *
 * @template Methods - The type representing the available JSON-RPC methods.
 * @param {string} endpoint - The URL of the JSON-RPC server.
 * @param {Object} [options] - Optional configuration options.
 * @param {number} [options.requestsPerSecond] - The maximum number of requests per second. If provided, rate limiting will be enabled.
 * @returns {CurriedRPC<Methods>} The JSON-RPC client instance.
 */
export function createJSONRPC<Methods extends RPCMethods>(
	endpoint: string,
	options?: {requestsPerSecond?: number},
): CurriedRPC<Methods> {
	return new JSONRPC(endpoint, options) as unknown as CurriedRPC<Methods>;
}

import PromiseThrottle from 'promise-throttle';
import {Result, RPCMethods} from '../types';
import {call} from '../common';
import {CurriedRPC, RequestRPC} from './types';

class JSONRPC {
	private promiseThrottle: PromiseThrottle | undefined;
	constructor(
		protected endpoint: string | RequestRPC<any>,
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
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		return (params: Params extends undefined ? void : Params) => {
			if (this.promiseThrottle) {
				return this.promiseThrottle.add(call.bind(null, this.endpoint, {method, params}));
			} else {
				return call<Method, Value, Error, Params>(this.endpoint, {method, params} as any);
			}
		};
	}

	callUnknown<
		Method extends string,
		Value,
		Error = undefined,
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		return this.call(method);
	}

	async request<
		Method extends string,
		Value,
		Error = undefined,
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(req: Params extends undefined ? {method: Method} : {method: Method; params: Params}): Promise<Value> {
		const result = await this.call<Method, Value, Error, Params>(req.method)((req as any).params);
		if (result.success === true) {
			return result.value;
		} else {
			throw result.error;
		}
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
	endpoint: string | RequestRPC<Methods>,
	options?: {requestsPerSecond?: number},
): CurriedRPC<Methods> & RequestRPC<Methods> {
	return new JSONRPC(endpoint as any, options) as unknown as CurriedRPC<Methods> & RequestRPC<Methods>;
}

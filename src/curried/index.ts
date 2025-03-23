import PromiseThrottle from 'promise-throttle';
import {Result, RPCMethods} from '../types';
import {call as rpcCall} from '../common';
import {CurriedRPC, RequestRPC} from './types';

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
	let promiseThrottle: PromiseThrottle | undefined;
	if (options?.requestsPerSecond) {
		promiseThrottle = new PromiseThrottle({
			requestsPerSecond: options.requestsPerSecond,
			promiseImplementation: Promise,
		});
	}

	function call<
		Method extends string,
		Value,
		Error = undefined,
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		return (params: Params extends undefined ? void : Params) => {
			if (promiseThrottle) {
				return promiseThrottle.add(rpcCall.bind(null, endpoint, {method, params}));
			} else {
				return rpcCall<Method, Value, Error, Params>(endpoint, {method, params} as any);
			}
		};
	}

	function callUnknown<
		Method extends string,
		Value,
		Error = undefined,
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(method: Method): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>> {
		return call(method);
	}

	async function request<
		Method extends string,
		Value,
		Error = undefined,
		Params extends any[] | Record<string, any> | undefined = undefined,
	>(req: Params extends undefined ? {method: Method} : {method: Method; params: Params}): Promise<Value> {
		const result = await call<Method, Value, Error, Params>(req.method)((req as any).params);
		if (result.success === true) {
			return result.value;
		} else {
			throw result.error;
		}
	}

	return {call, callUnknown, request} as unknown as CurriedRPC<Methods> & RequestRPC<Methods>;
}

async function typeTesting() {
	const jsonRPC = createJSONRPC('sd');
	jsonRPC.callUnknown<{params: [number, string]; result: string}>('test')([2, '22']);

	const jsonRPC2 = createJSONRPC<{
		test: {params: [number, string]; result: string};
	}>('sd');
	const result = await jsonRPC2.call('test')([2, '22']);
	if (result.success) {
		result.value;
	}
}

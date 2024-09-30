import PromiseThrottle from 'promise-throttle';
import {Result} from '../types';
import {call} from '../common';

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
}

export function createJSONRPC<
	T extends {
		call<
			Method extends string,
			Value,
			Error = undefined,
			Params extends any[] | Record<string, any> | undefined = undefined,
		>(
			method: Method,
		): (params: Params extends undefined ? void : Params) => Promise<Result<Value, Error>>;
	},
>(endpoint: string, options?: {requestsPerSecond?: number}): T {
	return new JSONRPC(endpoint, options) as unknown as T;
}

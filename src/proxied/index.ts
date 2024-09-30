import PromiseThrottle from 'promise-throttle';
import {Result} from '../types';
import {call} from '../common';

export function createJSONRPC<
	T extends {
		[method: string]: (params: undefined | any) => Promise<Result<any | undefined, any | undefined>>;
	},
>(endpoint: string, options?: {requestsPerSecond?: number}): T {
	const promiseThrottle =
		options?.requestsPerSecond != undefined
			? new PromiseThrottle({
					requestsPerSecond: options.requestsPerSecond,
					promiseImplementation: Promise,
				})
			: null;
	const handler = {
		get(target, prop, receiver) {
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
	return new Proxy({}, handler) as unknown as T;
}

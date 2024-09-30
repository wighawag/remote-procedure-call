import type {ProxiedRemoteCallType, RPCMethods} from '../types.js';

export type ProxiedRPC<T extends RPCMethods> = {
	[Property in keyof T]: ProxiedRemoteCallType<
		T[Property] extends {result: unknown} ? T[Property]['result'] : undefined,
		T[Property] extends {errors: unknown} ? T[Property]['errors'] : undefined,
		T[Property] extends {params: unknown} ? T[Property]['params'] : undefined
	>;
};

import {ProxiedRemoteCallType, RPCMethods} from '../types';

export type ProxiedRPC<T extends RPCMethods> = {
	[Property in keyof T]: ProxiedRemoteCallType<
		T[Property] extends {result: any} ? T[Property]['result'] : undefined,
		T[Property] extends {errors: any} ? T[Property]['errors'] : undefined,
		T[Property] extends {params: any} ? T[Property]['params'] : undefined
	>;
};

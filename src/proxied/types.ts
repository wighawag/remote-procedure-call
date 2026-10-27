import {ProxiedRemoteCallType, RPCMethods} from '../types';

export type ProxiedRPC<T extends RPCMethods> = {
	[Property in keyof T]: ProxiedRemoteCallType<T[Property]>;
};

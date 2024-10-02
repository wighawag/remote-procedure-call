import {CurriedRemoteCallType, RemoteRequestCallType, RPCMethods} from '../types';

export type CurriedUnion<T extends RPCMethods> = {
	[Property in keyof T]: CurriedRemoteCallType<
		Property extends string ? Property : never,
		T[Property] extends {result: any} ? T[Property]['result'] : undefined,
		T[Property] extends {errors: any} ? T[Property]['errors'] : undefined,
		T[Property] extends {params: any} ? T[Property]['params'] : undefined
	>;
}[keyof T];

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type OnlyCurriedRPC<T extends RPCMethods> = UnionToIntersection<CurriedUnion<T>>;

export type RequestUnion<T extends RPCMethods> = {
	[Property in keyof T]: RemoteRequestCallType<
		Property extends string ? Property : never,
		T[Property] extends {result: any} ? T[Property]['result'] : undefined,
		T[Property] extends {params: any} ? T[Property]['params'] : undefined
	>;
}[keyof T];

export type RequestRPC<T extends RPCMethods> = UnionToIntersection<RequestUnion<T>>;

export type CurriedRPC<T extends RPCMethods> = OnlyCurriedRPC<T> & RequestRPC<T>;

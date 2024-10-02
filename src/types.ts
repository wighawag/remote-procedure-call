import {RPCErrors} from './errors.js';

export type RPCRequestData = {params?: any; result?: any; errors?: any};

export type RPCMethods = Record<string, RPCRequestData>;

/**
 * A union type representing the result of an operation.
 * If the `Error` type parameter is `undefined`, the `Result` type is an object with a `success` property set to `true` and a `value` property of type `Value`.
 * If the `Error` type parameter is not `undefined`, the `Result` type is a union of two object types:
 * 1. An object with a `success` property set to `false` and an `error` property of type `Error`.
 * 2. An object with a `success` property set to `true` and a `value` property of type `Value`.
 * @template Value - The type of the value in case of success.
 * @template Error - The type of the error in case of failure. If not provided, it defaults to `undefined`.
 */
export type Result<Value, Error = undefined> = Error extends undefined
	? {
			success: true;
			value: Value;
		}
	:
			| {
					success: false;
					error: Error;
			  }
			| {
					success: true;
					value: Value;
			  };

/**
 * A custom error class representing an invalid JSON-RPC error.
 * @extends Error
 */
export class JSONRPCError extends Error {
	/**
	 * A boolean flag indicating whether the error is an invalid error.
	 * This indicate that it is not possible to assume the call has proceeded correctly
	 * @readonly
	 */
	public readonly isInvalidError = true;

	/**
	 * The underlying cause of the error.
	 * @readonly
	 */
	public readonly cause: Error;

	/**
	 * Creates a new instance of the `JSONRPCError` class.
	 * @param message - The error message.
	 * @param cause - The underlying cause of the error.
	 */
	constructor(message: string, cause: Error) {
		super(message);
		this.cause = cause;
	}
}

// taken from https://dev.to/bwca/deep-readonly-generic-in-typescript-4b04
export type DeepReadonly<T> = Readonly<{
	[K in keyof T]: T[K] extends number | string | symbol // Is it a primitive? Then make it readonly
		? Readonly<T[K]>
		: // Is it an array of items? Then make the array readonly and the item as well
			T[K] extends Array<infer A>
			? Readonly<Array<DeepReadonly<A>>>
			: // It is some other object, make it readonly as well
				DeepReadonly<T[K]>;
}>;

export type CurriedRemoteCallType<
	Method extends string,
	Value,
	Error = undefined,
	Params extends any[] | Record<string, any> | undefined = undefined,
> = (Params extends undefined
	? {
			call: (method: Method) => () => Promise<Result<Value, Error | RPCErrors>>;
		}
	: Params extends []
		? {
				call: (method: Method) => () => Promise<Result<Value, Error | RPCErrors>>;
			}
		: {
				call(method: Method): (params: DeepReadonly<Params>) => Promise<Result<Value, Error | RPCErrors>>;
			}) & {
	callUnknown: <T extends RPCMethods>(method: keyof T) => () => Promise<Result<T['result'], T['errors'] | RPCErrors>>;
};

export type RemoteRequestCallType<
	Method extends string,
	Value,
	Params extends any[] | Record<string, any> | undefined = undefined,
> = Params extends undefined
	? {
			request: (req: {method: Method}) => Promise<Value>;
		}
	: Params extends []
		? {
				request: (req: {method: Method}) => Promise<Value>;
			}
		: {
				request: (req: {method: Method; params: DeepReadonly<Params>}) => Promise<Value>;
			};

export type ProxiedRemoteCallType<
	Value,
	Error = undefined,
	Params extends any[] | Record<string, any> | undefined = undefined,
> = Params extends undefined
	? () => Promise<Result<Value, Error | RPCErrors>>
	: Params extends []
		? () => Promise<Result<Value, Error | RPCErrors>>
		: (params: DeepReadonly<Params>) => Promise<Result<Value, Error | RPCErrors>>;

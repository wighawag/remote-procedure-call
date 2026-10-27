import {RPCErrors} from './errors.js';

export type RPCRequestData = {params?: any; result?: any; errors?: any};

export type RPCMethods = Record<string, RPCRequestData>;

/**
 * What a client can be created over, besides a URL: anything with an async `request`, which is the
 * only thing ever called on it. Method syntax, so any typed EIP-1193-style provider fits, whatever
 * method table it is typed with.
 */
export type RequestEndpoint = {
	request(args: {method: string; params?: any}): Promise<any>;
};

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
	: | {
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
	[K in keyof T]: T[K] extends
		number | string | symbol // Is it a primitive? Then make it readonly
		? Readonly<T[K]>
		: // Is it an array of items? Then make the array readonly and the item as well
			T[K] extends Array<infer A>
			? Readonly<Array<DeepReadonly<A>>>
			: // It is some other object, make it readonly as well
				DeepReadonly<T[K]>;
}>;

/**
 * The curried function for ONE entry of a method table. `Entry` is a naked type parameter, so for a
 * union entry this distributes, and {@link MethodCall} intersects the results into overloads.
 */
type EntryCall<Entry> = Entry extends RPCRequestData
	? [Entry extends {params: any} ? Entry['params'] : undefined] extends [undefined]
		? () => Promise<Result<EntryResult<Entry>, EntryErrors<Entry> | RPCErrors>>
		: [Entry['params']] extends [readonly []]
			? () => Promise<Result<EntryResult<Entry>, EntryErrors<Entry> | RPCErrors>>
			: (params: DeepReadonly<Entry['params']>) => Promise<Result<EntryResult<Entry>, EntryErrors<Entry> | RPCErrors>>
	: never;
type EntryResult<Entry> = Entry extends {result: any} ? Entry['result'] : undefined;
type EntryErrors<Entry> = Entry extends {errors: any} ? Entry['errors'] : undefined;
type IntersectUnion<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** What calling a method returns: one function, overloaded once per entry of a union entry. */
export type MethodCall<Entry> = IntersectUnion<EntryCall<Entry>>;

export type CurriedRemoteCallType<Method extends string, Entry> = {
	call(method: Method): MethodCall<Entry>;
} & {
	callUnknown: <UnknownRequest extends RPCRequestData>(
		method: string,
	) => [UnknownRequest['params']] extends [undefined]
		? () => Promise<Result<UnknownRequest['result'], UnknownRequest['errors'] | RPCErrors>>
		: [UnknownRequest['params']] extends [readonly []]
			? () => Promise<Result<UnknownRequest['result'], UnknownRequest['errors'] | RPCErrors>>
			: (
					params: DeepReadonly<UnknownRequest['params']>,
				) => Promise<Result<UnknownRequest['result'], UnknownRequest['errors'] | RPCErrors>>;
};

export type RemoteRequestCallType<
	Method extends string,
	Value,
	Params extends any[] | Record<string, any> | undefined = undefined,
> = [Params] extends [undefined]
	? {
			// no-param methods: `params` may be omitted, or sent as an empty array, which is what
			// most JSON-RPC transports do on the wire.
			request: (req: {method: Method; params?: readonly []}) => Promise<Value>;
		}
	: [Params] extends [readonly []]
		? {
				request: (req: {method: Method; params?: readonly []}) => Promise<Value>;
			}
		: {
				request: (req: {method: Method; params: DeepReadonly<Params>}) => Promise<Value>;
			};

/** The proxied function for one method: overloaded once per entry of a union entry. */
export type ProxiedRemoteCallType<Entry> = MethodCall<Entry>;

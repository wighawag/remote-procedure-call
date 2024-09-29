import PromiseThrottle from 'promise-throttle';

type Result<Value, Error = undefined> = Error extends undefined
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

export class JSONRPCError extends Error {
	public readonly isInvalidError = true;
	constructor(
		message: string,
		public cause: Error,
	) {
		super(message);
	}
}

let counter = 0;
export async function call<
	Method extends string,
	Value,
	Error = undefined,
	Params extends any[] | Record<string, any> | undefined = undefined,
>(
	endpoint: string,
	req: Params extends undefined ? {method: Method} : {method: Method; params: Params},
): Promise<Result<Value, Error>> {
	const params = 'params' in req && req.params;
	const method = req.method;

	let response: Response;
	try {
		response = await fetch(endpoint, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				id: ++counter,
				jsonrpc: '2.0',
				method,
				params,
			}),
		});
	} catch (fetchError) {
		throw new JSONRPCError(`Failed To Fetch at ${endpoint} (method: ${method})`, fetchError);
	}

	if (response.status != 200) {
		throw new JSONRPCError(
			`Failed To Fetch (status = ${response.status}) at ${endpoint} (method: ${method})`,
			new Error(`status: ${response.status}`),
		);
	}
	let json: {result?: Value; error?: any};
	try {
		json = await response.json();
	} catch (parsingError) {
		throw new JSONRPCError('Failed To parse response json', parsingError);
	}

	if (json.error) {
		return {success: false, error: json.error as Error} as Result<Value, Error>;
	}

	return {success: true, value: json.result} as Result<Value, Error>;
}

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

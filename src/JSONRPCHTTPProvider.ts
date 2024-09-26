import PromiseThrottle from 'promise-throttle';

export class JSONRPCError extends Error {
	public readonly isInvalidError = true;
	constructor(
		message: string,
		public cause: Error,
	) {
		super(message);
	}
}

export type ProviderType<Method extends string, Result, Params = undefined> = {
	request(
		args: Params extends undefined
			? {method: Method}
			: Params extends any[]
				? {method: Method; params: Params}
				: {method: Method; params: [Params]},
	): Promise<Result>;
};

let counter = 0;
export async function request<Method extends string, Result, Params = undefined>(
	endpoint: string,
	req: Params extends undefined
		? {method: Method}
		: Params extends any[]
			? {method: Method; params: Params}
			: {method: Method; params: [Params]},
): Promise<Result> {
	const params = 'params' in req && req.params;
	const method = req.method;

	// NOTE: special case to allow batch request via EIP-1193
	if (req.method === 'eth_batch') {
		if (!params) {
			throw new JSONRPCError(`Invalid Batch Call, params array not defined`, new Error(`params: ${params}`));
		}
		if ((params as any[]).length === 0) {
			return [] as unknown as Result;
		}

		const requests = [];
		for (const param of params as {method: string; params?: any[]}[]) {
			requests.push({
				id: ++counter,
				jsonrpc: '2.0',
				method: param.method,
				params: param.params,
			});
		}

		let response: Response;
		try {
			response = await fetch(endpoint, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(requests),
			});
		} catch (fetchError) {
			throw new JSONRPCError(`Failed To Batch Fetch at ${endpoint}`, fetchError);
		}

		if (response.status != 200) {
			throw new JSONRPCError(
				`Failed To Batch Fetch (Status = ${response.status}) at ${endpoint}`,
				new Error(`status: ${response.status}`),
			);
		}

		let jsonArray: {result?: Result; error?: any}[];
		try {
			jsonArray = await response.json();
		} catch (parsingError) {
			throw new JSONRPCError('Failed To Batch parse response as json', parsingError);
		}

		let hasError = false;
		for (const response of jsonArray) {
			if (response.error || !response.result) {
				hasError = true;
			}
		}

		if (hasError) {
			throw jsonArray;
		}

		return jsonArray.map((v) => v.result) as unknown as Result;
	}
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
	let json: {result?: Result; error?: any};
	try {
		json = await response.json();
	} catch (parsingError) {
		throw new JSONRPCError('Failed To parse response json', parsingError);
	}

	if (json.error || !json.result) {
		throw json.error || {code: 5000, message: 'No Result'};
	}
	return json.result;
}

class JSONRPCHTTPProvider {
	supportsETHBatch = true;
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

	request<Method extends string, Result, Params = undefined>(
		args: Params extends undefined
			? {method: Method}
			: Params extends any[]
				? {method: Method; params: Params}
				: {method: Method; params: [Params]},
	): Promise<Result> {
		if (this.promiseThrottle) {
			return this.promiseThrottle.add(request.bind(null, this.endpoint, args));
		} else {
			return request<Method, Result, Params>(this.endpoint, args);
		}
	}
}

export function createJSONRPCHTTPProvider<T>(endpoint: string, options?: {requestsPerSecond?: number}): T {
	return new JSONRPCHTTPProvider(endpoint, options) as T;
}

import {JSONRPCError, Result} from '../types';

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

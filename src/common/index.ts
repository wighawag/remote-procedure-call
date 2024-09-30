import {JSONRPCError} from '../errors.js';
import type {Result} from '../types.js';

let counter = 0;

/**
 * Sends a JSON-RPC request to the specified endpoint and returns a Promise that resolves with the result.
 *
 * @template Method - The method name of the JSON-RPC request.
 * @template Value - The expected type of the result value.
 * @template Error - The expected type of the error object (optional, defaults to `undefined`).
 * @template Params - The type of the parameters object (optional, defaults to `undefined`).
 *
 * @param {string} endpoint - The URL of the JSON-RPC endpoint.
 * @param {Object} req - The request object, containing the method name and optional parameters.
 * @param {Method} req.method - The method name of the JSON-RPC request.
 * @param {Params} [req.params] - The parameters for the JSON-RPC request (optional).
 *
 * @returns {Promise<Result<Value, Error>>} A Promise that resolves with a `Result` object containing the result value or error.
 *
 * @throws {JSONRPCError} If there is an error fetching or parsing the response.
 */
export async function call<
	Method extends string,
	Value,
	Error = undefined,
	Params extends unknown[] | Record<string, unknown> | undefined = undefined,
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
		throw new JSONRPCError(`Failed To Fetch at ${endpoint} (method: ${method})`, fetchError as globalThis.Error);
	}

	if (response.status !== 200) {
		throw new JSONRPCError(
			`Failed To Fetch (status = ${response.status}) at ${endpoint} (method: ${method})`,
			new Error(`status: ${response.status}`),
		);
	}
	let json: {result?: Value; error?: unknown};
	try {
		json = await response.json();
	} catch (parsingError) {
		throw new JSONRPCError('Failed To parse response json', parsingError as globalThis.Error);
	}

	if (json.error) {
		return {success: false, error: json.error as Error} as Result<Value, Error>;
	}

	return {success: true, value: json.result} as Result<Value, Error>;
}

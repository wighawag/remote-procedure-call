# remote-procedure-call

This is a TypeScript library that provides utilities for creating JSON-RPC clients with optional rate-limiting capabilities. JSON-RPC (JSON Remote Procedure Call) is a protocol that allows you to make remote procedure calls over a network using JSON as the data format. This library simplifies the process of making JSON-RPC calls and provides type safety, error handling, and rate-limiting features.

It offers two different approaches: a curried approach and a proxied approach.

## Installation

```bash
npm install remote-procedure-call
```

## Usage

Both approach let you pass a type parameter to get typings for all available methods. The type parameter must follow the following structure:

```ts
export type RPCMethods = Record<string, {params?: any; result?: any; errors?: any}>;
```

- `params`: The type of the parameters expected by the RPC method.
- `result`: The expected return type of the RPC method on successful execution.
- `errors`: The type of errors that can be returned by the RPC method.

The return type of each function call is either a successful response:

```ts
{
	success: true;
	value: Value;
}
```

or a failed response:

```ts
{
	success: false;
	error: Error;
}
```

### Curried Approach

The `createCurriedJSONRPC` function creates a JSON-RPC client instance with a curried `call` method. It has minimal overhead and still allow for nice auto-completion for both method names and parameters. Plus it allow to easily call unspecified method by adding type parameter on the fly.

```typescript
import {createCurriedJSONRPC} from 'remote-procedure-call';

const jsonrpc = createCurriedJSONRPC<{
	eth_getBlockByNumber: {
		params: [number, boolean];
		result: {hash: string} | null;
		errors: {
			code: -32602;
			message: 'non-array args';
		};
	};
	eth_chainId: {
		result: string;
	};
}>('https://rpc.ankr.com/eth');

// Call a remote method with parameters
const blockResponse = await jsonrpc.call('eth_getBlockByNumber')([1, false]);
if (blockResponse.success) {
	console.log(`hash: ${blockResponse.value.hash}`);
} else {
	// Handle error
	console.error(blockResponse.error);
}

// Call a remote method without parameters
const chainIdResponse = await jsonrpc.call('eth_chainId')();
if (chainIdResponse.success) {
	console.log(`chainId: ${chainIdResponse.value}`);
} else {
	// Handle error
	console.error(chainIdResponse.error);
}
```

### Proxied Approach

The `createProxiedJSONRPC` function creates a JSON-RPC client instance as a proxy object, where each remote method is exposed as a property on the object. The proxied approach provides a more familiar syntax for calling methods.

```typescript
import {createProxiedJSONRPC} from 'remote-procedure-call';

const jsonrpc = createProxiedJSONRPC<{
	eth_getBlockByNumber: {
		params: [number, boolean];
		result: {hash: string} | null;
		errors: {
			code: -32602;
			message: 'non-array args';
		};
	};
	eth_chainId: {
		result: string;
	};
}>('https://rpc.ankr.com/eth');

// Call a remote method with parameters
const blockResponse = await jsonrpc.eth_getBlockByNumber([1, false]);
if (blockResponse.success) {
	console.log(`hash: ${blockResponse.value.hash}`);
} else {
	// Handle error
	console.error(blockResponse.error);
}

// Call a remote method without parameters
const chainIdResponse = await jsonrpc.eth_chainId();
if (chainIdResponse.success) {
	console.log(`chainId: ${chainIdResponse.value}`);
} else {
	// Handle error
	console.error(chainIdResponse.error);
}
```

### Error Handling

Both approaches return a response object with a `success` property indicating whether the call was successful or not. If `success` is `false

### Rate Limiting

Both `createCurriedJSONRPC` and `createProxiedJSONRPC` accept an optional `options` object with a `requestsPerSecond` property to enable rate limiting.

```typescript
import {createCurriedJSONRPC} from 'remote-rpocedure-call';

const jsonrpc = createCurriedJSONRPC<{
	getValue: {
		params: {
			id: string;
		};
		result: string;
		errors: {code: 1; message: string} | {code: 2; message: string};
	};
	specVersion: {
		result: string;
	};
}>('https://api.example.com', {requestsPerSecond: 10});
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

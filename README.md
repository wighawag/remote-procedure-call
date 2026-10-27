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

### Methods with several parameter shapes

A method's entry may be a UNION, one entry per parameter shape. Each entry becomes its own overload, so the result narrows with the parameters, for `request`, for `call` and for the proxied client alike:

```ts
type MyMethods = {
	eth_getBlockByNumber:
		| {params: [string, false?]; result: Block | null}
		| {params: [string, true]; result: BlockWithTransactions | null};
};

const rpc = createCurriedJSONRPC<MyMethods>(url);
const block = await rpc.request({method: 'eth_getBlockByNumber', params: ['latest', true]}); // BlockWithTransactions | null
```

A flag typed `boolean` matches neither overload (TypeScript does not spread a union argument across overloads): branch on it, `flag ? rpc.call('eth_getBlockByNumber')([tag, true]) : rpc.call('eth_getBlockByNumber')([tag, false])`.

There is no catch-all `request` overload: a typo or wrong parameters are reported against the method you called. To call a method outside the table, extend the table, or use `callUnknown`.

### Using an eip-1193 method table

The request typing is the same machinery as [`eip-1193`](https://github.com/jolly-roger-eth/eip-1193) (0.7 and later), so a client typed with one of its tables is assignable to the matching provider type, and can be passed wherever a library asks for one:

```ts
import type {Methods, EIP1193WalletProvider, EIP1193CoreProvider} from 'eip-1193';

const rpc = createCurriedJSONRPC<Methods>(window.ethereum);
const asWallet: EIP1193WalletProvider = rpc;
const asCore: EIP1193CoreProvider = rpc;
```

### Over a provider instead of a URL

`createCurriedJSONRPC` also takes any object with an async `request({method, params})`, an EIP-1193 provider for example, whatever method table it is typed with. Every request is forwarded to it.

### Error Handling

Both approaches return a response object with a `success` property indicating whether the call was successful or not. If `success` is `false

### Rate Limiting

Both `createCurriedJSONRPC` and `createProxiedJSONRPC` accept an optional `options` object with a `requestsPerSecond` property to enable rate limiting.

```typescript
import {createCurriedJSONRPC} from 'remote-procedure-call';

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

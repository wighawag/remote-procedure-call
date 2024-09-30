import {test} from 'vitest';
import {createCurriedJSONRPC} from '../src';
import {createProxiedJSONRPC} from '../src';

test('curried', async function () {
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
	}

	// Call a remote method without parameters
	const chainIdResponse = await jsonrpc.call('eth_chainId')();
	if (chainIdResponse.success) {
		console.log(`chainId: ${chainIdResponse.value}`);
	}
});

test('proxied', async function () {
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
	}

	// Call a remote method without parameters
	const chainIdResponse = await jsonrpc.eth_chainId();
	if (chainIdResponse.success) {
		console.log(`chainId: ${chainIdResponse.value}`);
	}
});

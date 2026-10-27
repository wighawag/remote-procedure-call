import {expect, test} from 'vitest';
import {createCurriedJSONRPC} from '../src';

// An in-memory EIP-1193-style endpoint: no network.
function fakeEndpoint() {
	const calls: {method: string; params?: unknown}[] = [];
	return {
		calls,
		async request(args: {method: string; params?: any}) {
			calls.push(args);
			if (args.method === 'eth_chainId') return '0x1';
			if (args.method === 'echo') return args.params;
			throw Object.assign(new Error('nope'), {code: -32601});
		},
	};
}

type Table = {
	eth_chainId: {result: `0x${string}`};
	echo: {params: [string, number]; result: [string, number]};
};

for (const requestsPerSecond of [undefined, 1000]) {
	test(`request, call and callUnknown go through an object endpoint (throttle: ${requestsPerSecond ?? 'off'})`, async () => {
		const endpoint = fakeEndpoint();
		const rpc = createCurriedJSONRPC<Table>(endpoint, {requestsPerSecond});

		expect(await rpc.request({method: 'eth_chainId'})).toBe('0x1');
		expect(await rpc.call('echo')(['a', 1])).toEqual({success: true, value: ['a', 1]});
		const unknown = await rpc.callUnknown<{params: []; result: unknown}>('missing')();
		expect(unknown.success).toBe(false);
		await expect(rpc.request({method: 'missing'} as never)).rejects.toMatchObject({code: -32601});
		expect(endpoint.calls.map((c) => c.method)).toEqual(['eth_chainId', 'echo', 'missing', 'missing']);
	});
}

/**
 * Type tests: `tsc -p test-d/tsconfig.json` (the `test:types` script) IS the test. Nothing here is
 * executed. The point: a client typed with an eip-1193 method table is assignable to the matching
 * eip-1193 provider type (0.7 and later), and union entries become real overloads.
 */
import type {
	CoreMethods,
	EIP1193Block,
	EIP1193BlockWithTransactions,
	EIP1193CoreProvider,
	EIP1193HttpNodeProvider,
	EIP1193NodeProvider,
	EIP1193WalletProvider,
	EIP1193WindowWalletProvider,
	Methods,
	NodeMethods,
} from 'eip-1193';
import {
	createCurriedJSONRPC,
	createProxiedJSONRPC,
	type CurriedRPC,
	type ProxiedRPC,
	type RPCErrors,
} from '../src/index.js';

type Expect<T extends true> = T;
type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

declare const wallet: CurriedRPC<Methods>;
declare const node: CurriedRPC<NodeMethods>;

// A. assignable to the eip-1193 provider types
export const _asWallet: EIP1193WalletProvider = wallet;
export const _asCore: EIP1193CoreProvider = wallet;
export const _nodeAsNode: EIP1193NodeProvider = node;
export const _nodeAsCore: EIP1193CoreProvider = node;
// @ts-expect-error a node client offers no wallet_* methods
export const _nodeAsWallet: EIP1193WalletProvider = node;

// B. created over any eip-1193 provider, whatever table it is typed with
declare const windowWallet: EIP1193WindowWalletProvider;
declare const httpNode: EIP1193HttpNodeProvider;
export const _overWallet: CurriedRPC<Methods> = createCurriedJSONRPC<Methods>(windowWallet);
export const _overNode: CurriedRPC<CoreMethods> = createCurriedJSONRPC<CoreMethods>(httpNode);

export async function narrowing() {
	// C. request: a union entry is a set of overloads, so the hydrated flag narrows the result
	const block = await wallet.request({method: 'eth_getBlockByNumber', params: ['latest', false]});
	const full = await wallet.request({method: 'eth_getBlockByNumber', params: ['latest', true]});
	type _C1 = Expect<Equal<typeof block, EIP1193Block | null>>;
	type _C2 = Expect<Equal<typeof full, EIP1193BlockWithTransactions | null>>;

	// no-param methods take no params, or an empty array
	await wallet.request({method: 'eth_chainId'});
	await wallet.request({method: 'eth_chainId', params: []});

	// D. call: the same overloads, curried
	const curriedBlock = await wallet.call('eth_getBlockByNumber')(['latest', false]);
	const curriedFull = await wallet.call('eth_getBlockByNumber')(['latest', true]);
	if (curriedBlock.success && curriedFull.success) {
		type _D1 = Expect<Equal<typeof curriedBlock.value, EIP1193Block | null>>;
		type _D2 = Expect<Equal<typeof curriedFull.value, EIP1193BlockWithTransactions | null>>;
	}
	const chainId = await wallet.call('eth_chainId')();
	if (chainId.success) {
		type _D3 = Expect<Equal<typeof chainId.value, `0x${string}`>>;
	}

	// E. mistakes are reported, not swallowed by a catch-all
	// @ts-expect-error a typo is not a method
	await wallet.request({method: 'eth_blockNumbr'});
	// @ts-expect-error wrong params
	await wallet.request({method: 'eth_getBalance', params: [42]});
	// @ts-expect-error a typo through call
	wallet.call('eth_blockNumbr');
	// @ts-expect-error params given to a method that takes none
	await wallet.call('eth_chainId')(['x']);

	// F. calling outside the table goes through callUnknown
	await wallet.callUnknown<{params: [string]; result: boolean}>('my_method')(['x']);
}

// G. proxied: same overloads
declare const proxied: ProxiedRPC<Methods>;
export async function proxiedNarrowing() {
	const full = await proxied.eth_getBlockByNumber(['latest', true]);
	if (full.success) {
		type _G1 = Expect<Equal<typeof full.value, EIP1193BlockWithTransactions | null>>;
	}
	return createProxiedJSONRPC<Methods>('http://localhost:8545');
}

// H. tables that do not come from eip-1193: record params, errors, result-only entries
type Api = {
	getValue: {params: {id: string}; result: string; errors: {code: 1; message: string} | {code: 2; message: string}};
	pair: {params: [number, string]; result: boolean};
	specVersion: {result: string};
};
declare const api: CurriedRPC<Api>;
export async function plainTable() {
	const value = await api.call('getValue')({id: 'x'});
	if (value.success) {
		type _H1 = Expect<Equal<typeof value.value, string>>;
	} else {
		type _H2 = Expect<Equal<typeof value.error, {code: 1; message: string} | {code: 2; message: string} | RPCErrors>>;
	}
	await api.call('pair')([1, 'a']);
	const version = await api.call('specVersion')();
	if (version.success) {
		type _H3 = Expect<Equal<typeof version.value, string>>;
	}
	const viaRequest: string = await api.request({method: 'getValue', params: {id: 'x'}});
	// @ts-expect-error missing params
	await api.call('getValue')();
	return viaRequest;
}

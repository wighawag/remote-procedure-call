---
'remote-procedure-call': minor
---

**Union method entries become overloads, and clients fit eip-1193 0.7 provider types.** A method whose entry is a union (one entry per parameter shape) now gets one overload per entry, for `request`, for `call` and for the proxied client, so the result narrows with the parameters: `eth_getBlockByNumber` with `true` resolves with a block with transactions, with `false` without. The request typing is now the same machinery as `eip-1193` 0.7, so a `CurriedRPC<Methods>` built from an eip-1193 table is assignable to the matching eip-1193 provider type (`EIP1193WalletProvider`, `EIP1193CoreProvider`, ...). It was assignable to none of them, because the result of a union entry did not narrow. No-parameter methods accept `params` omitted or `[]`.

Breaking, hence a minor:

- `RequestRPC` has no `request(req: {method: string; ...})` catch-all overload any more. It accepted every call, so typos compiled, and its `DeepReadonly<any>` params rejected arrays anyway. A last, unsatisfiable overload now makes TypeScript report errors against the method you called. Call a method outside the table through `callUnknown`, or extend the table.
- `CurriedRemoteCallType<Method, Entry>` and `ProxiedRemoteCallType<Entry>` now take the method's table entry instead of separate value, error and params parameters. New export: `MethodCall<Entry>`.
- `createCurriedJSONRPC`'s endpoint is a URL or any object with an async `request` (new export `RequestEndpoint`), instead of a `RequestRPC` of the same table, so any EIP-1193 provider is accepted whatever table it is typed with.

Also: package metadata (description, repository, license MIT, author, homepage, bugs, keywords), a LICENSE file, and publishing through GitHub Actions with npm provenance. Type tests (`test-d`) pin the eip-1193 assignability and the narrowing.

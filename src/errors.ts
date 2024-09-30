// Parse error	Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.
export const ParseError = (message: string) => ({
  code: -32700 as const,
  message,
});

// Invalid Request	The JSON sent is not a valid request object.
export const InvalidRequest = (message: string) => ({
  code: -32600 as const,
  message,
});

// Method not found	The method does not exist/is not available.
export const MethodNotFound = (message: string) => ({
  code: -32601 as const,
  message,
});

// Invalid params	Invalid method parameter(s).
export const InvalidParams = (message: string) => ({
  code: -32602 as const,
  message,
});

// Internal error	Internal JSON-RPC error.
export const InternalError = (message: string) => ({
  code: -32063 as const,
  message,
});

// Server error	Reserved for implementation-defined server errors. See the note below.}
export const ServerError = (message: string) => ({ code: -32000, message });

export type TypeOfParseError = ReturnType<typeof ParseError>;
export type TypeOfInvalidRequest = ReturnType<typeof InvalidRequest>;
export type TypeOfMethodNotFound = ReturnType<typeof MethodNotFound>;
export type TypeOfInvalidParams = ReturnType<typeof InvalidParams>;
export type TypeOfInternalError = ReturnType<typeof InternalError>;
export type TypeOfServerError = ReturnType<typeof ServerError>;

export type RPCErrors =
  | TypeOfParseError
  | TypeOfInvalidRequest
  | TypeOfMethodNotFound
  | TypeOfInvalidParams
  | TypeOfInternalError
  | TypeOfServerError;

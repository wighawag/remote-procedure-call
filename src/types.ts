export type Result<Value, Error = undefined> = Error extends undefined
	? {
			success: true;
			value: Value;
		}
	:
			| {
					success: false;
					error: Error;
			  }
			| {
					success: true;
					value: Value;
			  };

export class JSONRPCError extends Error {
	public readonly isInvalidError = true;
	constructor(
		message: string,
		public cause: Error,
	) {
		super(message);
	}
}

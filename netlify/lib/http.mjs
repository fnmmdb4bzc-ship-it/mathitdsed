/**
 * The error type every layer throws to set an HTTP status.
 *
 * It lives in its own file rather than in auth.mjs because the identity
 * adapters need it too, and auth.mjs imports the adapters - having them import
 * auth.mjs back would be a cycle.
 */
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

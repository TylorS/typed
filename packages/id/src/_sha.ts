import * as Effect from "effect/Effect";

/**
 * Digests bytes with Web Crypto SHA-1 and returns a fresh Uint8Array.
 * @remarks
 * ## Why
 * This published low-level helper exposes the exact hash required by UUID version 5; SHA-1 here is identity derivation, not password or signature security. Missing Web Crypto and rejected `subtle.digest` promises are Effect defects because the typed error channel is `never`.
 * ## Ownership and lifetime
 * Each Effect owns one asynchronous Web Crypto request and transfers a fresh result buffer; it retains no input after completion.
 * @example
 * ```ts
 * import { sha1 } from "@typed/id/_sha"
 * import { Effect } from "effect"
 * const digest = Effect.runPromise(sha1(new TextEncoder().encode("name")))
 * ```
 * @category Hashing
 * @since 1.0.0
 */
export const sha1 = (data: BufferSource) =>
  Effect.promise(() =>
    crypto.subtle.digest("SHA-1", data).then((buffer) => new Uint8Array(buffer)),
  );

/**
 * Digests bytes with Web Crypto SHA-512 and returns a fresh Uint8Array.
 * @remarks
 * ## Why
 * This published low-level helper exposes the exact domain-separated hash used by CUID formatting without hiding platform requirements. Missing Web Crypto and rejected `subtle.digest` promises are Effect defects because the typed error channel is `never`.
 * ## Ownership and lifetime
 * Each Effect owns one asynchronous Web Crypto request and transfers a fresh result buffer; it retains no input after completion.
 * @example
 * ```ts
 * import { sha512 } from "@typed/id/_sha"
 * import { Effect } from "effect"
 * const digest = Effect.runPromise(sha512(new TextEncoder().encode("seed")))
 * ```
 * @category Hashing
 * @since 1.0.0
 */
export const sha512 = (data: BufferSource) =>
  Effect.promise(() =>
    crypto.subtle.digest("SHA-512", data).then((buffer) => new Uint8Array(buffer)),
  );

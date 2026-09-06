import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Schema from "effect/Schema";
import { sha1 } from "./_sha.js";
import { uuidStringify } from "./_uuid-stringify.js";

/**
 * Effect Schema and branded string type for RFC UUID version 5 values.
 * @remarks
 * ## Why
 * The schema verifies UUID version and variant at transport boundaries before restoring the compile-time brand.
 * ## Ownership and lifetime
 * This module-level schema value acquires no resources and is shared; no runtime freezing guarantee is implied.
 * @example
 * ```ts
 * import { Uuid5 } from "@typed/id/Uuid5"
 * import { Schema } from "effect"
 * const id = Schema.decodeUnknownSync(Uuid5)("21f7f8de-8051-5b89-8680-0195ef798b6a")
 * ```
 * @category ID schemas
 * @since 1.0.0
 */
export const Uuid5 = Schema.String.pipe(
  Schema.check(Schema.isUUID(5)),
  Schema.brand("@typed/id/UUID5"),
);
export type Uuid5 = typeof Uuid5.Type;

/**
 * Tests whether a string is an RFC UUID version 5 value.
 * @remarks
 * ## Why
 * Runtime refinement restores trust after serialization has erased the TypeScript brand.
 * ## Ownership and lifetime
 * This pure predicate acquires no resources and retains no input.
 * @example
 * ```ts
 * import { isUuid5 } from "@typed/id/Uuid5"
 * isUuid5("21f7f8de-8051-5b89-8680-0195ef798b6a")
 * ```
 * @category ID validation
 * @since 1.0.0
 */
export const isUuid5: (value: string) => value is Uuid5 = Schema.is(Uuid5);

/**
 * The exact 16 namespace bytes used in UUID version 5 hashing.
 * @remarks
 * ## Why
 * Namespace bytes are part of deterministic identity; caller canonicalization of names and namespace selection must remain explicit.
 * ## Ownership and lifetime
 * This type acquires no resources. Callers own and may mutate their byte array; generation reads exactly 16 bytes.
 * @category ID types
 * @since 1.0.0
 */
export type Uuid5Namespace = Uint8Array;

const textEncoder = new TextEncoder();

// Pre-defined namespaces from RFC 4122
const DNS = new Uint8Array([
  0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);
const URL = new Uint8Array([
  0x6b, 0xa7, 0xb8, 0x11, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);
const OID = new Uint8Array([
  0x6b, 0xa7, 0xb8, 0x12, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);
const X500 = new Uint8Array([
  0x6b, 0xa7, 0xb8, 0x14, 0x9d, 0xad, 0x11, 0xd1, 0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);

/**
 * Standard RFC UUID version 5 namespaces, returned as fresh mutable copies.
 * @remarks
 * ## Why
 * Copy-on-access protects canonical constants while allowing callers to own and safely modify their selected namespace bytes.
 * ## Ownership and lifetime
 * The module owns canonical bytes for its lifetime; every property access transfers a fresh 16-byte copy to the caller.
 * @example
 * ```ts
 * import { Uuid5Namespace } from "@typed/id/Uuid5"
 * const namespace = Uuid5Namespace.DNS
 * ```
 * @category Name-based identity
 * @since 1.0.0
 */
export const Uuid5Namespace: {
  /**
   * Returns a fresh copy of the RFC DNS namespace bytes.
   * @remarks
   * ## Why
   * DNS names need a stable namespace distinct from URLs, OIDs, and X.500 names.
   * ## Ownership and lifetime
   * Each access allocates a mutable byte array owned by the caller.
   * @category Name-based identity
   * @since 1.0.0
   */
  readonly DNS: Uint8Array<ArrayBuffer>;
  /**
   * Returns a fresh copy of the RFC URL namespace bytes.
   * @remarks
   * ## Why
   * URL names need a stable namespace distinct from DNS, OID, and X.500 names.
   * ## Ownership and lifetime
   * Each access allocates a mutable byte array owned by the caller.
   * @category Name-based identity
   * @since 1.0.0
   */
  readonly URL: Uint8Array<ArrayBuffer>;
  /**
   * Returns a fresh copy of the RFC OID namespace bytes.
   * @remarks
   * ## Why
   * Object identifiers need a stable namespace distinct from DNS, URL, and X.500 names.
   * ## Ownership and lifetime
   * Each access allocates a mutable byte array owned by the caller.
   * @category Name-based identity
   * @since 1.0.0
   */
  readonly OID: Uint8Array<ArrayBuffer>;
  /**
   * Returns a fresh copy of the RFC X.500 namespace bytes.
   * @remarks
   * ## Why
   * X.500 names need a stable namespace distinct from DNS, URL, and OID names.
   * ## Ownership and lifetime
   * Each access allocates a mutable byte array owned by the caller.
   * @category Name-based identity
   * @since 1.0.0
   */
  readonly X500: Uint8Array<ArrayBuffer>;
} = Object.freeze({
  get DNS() {
    return DNS.slice(0);
  },
  get URL() {
    return URL.slice(0);
  },
  get OID() {
    return OID.slice(0);
  },
  get X500() {
    return X500.slice(0);
  },
});

/**
 * Derives a deterministic UUID version 5 from a UTF-8 name and 16-byte namespace.
 * @remarks
 * ## Why
 * Determinism is exact for the same name bytes and namespace. Invalid namespace length fails in the typed channel with `IllegalArgumentError`; missing Web Crypto or a rejected SHA-1 digest is an Effect defect, not a typed error.
 * ## Ownership and lifetime
 * Each Effect acquires no persistent resources, reads but does not retain the namespace, and uses Web Crypto `subtle.digest` for the invocation.
 * @example
 * ```ts
 * import { uuid5, Uuid5Namespace } from "@typed/id/Uuid5"
 * const id = uuid5("example.com", Uuid5Namespace.DNS)
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const uuid5: {
  (namespace: Uuid5Namespace): (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
  (name: string, namespace: Uuid5Namespace): Effect.Effect<Uuid5, Cause.IllegalArgumentError>;
} = dual(2, function uuid5(name: string, namespace: Uuid5Namespace): Effect.Effect<
  Uuid5,
  Cause.IllegalArgumentError
> {
  return Effect.gen(function* () {
    if (namespace.length !== 16) {
      return yield* new Cause.IllegalArgumentError(
        `UUIDv5 namespace must contain exactly 16 bytes, received ${namespace.length}`,
      );
    }

    // Convert name to UTF-8 bytes
    const nameBytes = textEncoder.encode(name);

    // Concatenate namespace and name
    const buffer = new Uint8Array(namespace.length + nameBytes.length);
    buffer.set(namespace);
    buffer.set(nameBytes, namespace.length);

    // Hash the concatenated bytes
    const hash = yield* sha1(buffer);

    // Format as UUID v5
    const result = new Uint8Array(16);

    // Copy first 16 bytes of the hash
    result.set(hash.subarray(0, 16));

    // Set version (5) and variant bits
    result[6] = (result[6] & 0x0f) | 0x50; // version 5
    result[8] = (result[8] & 0x3f) | 0x80; // variant 1

    return Uuid5.make(uuidStringify(result));
  });
});

/**
 * Derives deterministic UUID version 5 values in the standard DNS namespace.
 * @remarks
 * ## Why
 * The pre-bound helper prevents accidental namespace selection drift for DNS identities.
 * ## Ownership and lifetime
 * This function acquires no persistent resources and uses a captured namespace copy for module lifetime.
 * @example
 * ```ts
 * import { dnsUuid5 } from "@typed/id/Uuid5"
 * const id = dnsUuid5("example.com")
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const dnsUuid5 = uuid5(Uuid5Namespace.DNS);
/**
 * Derives deterministic UUID version 5 values in the standard URL namespace.
 * @remarks
 * ## Why
 * The pre-bound helper prevents accidental namespace selection drift for URL identities.
 * ## Ownership and lifetime
 * This function acquires no persistent resources and uses a captured namespace copy for module lifetime.
 * @example
 * ```ts
 * import { urlUuid5 } from "@typed/id/Uuid5"
 * const id = urlUuid5("https://example.com")
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const urlUuid5 = uuid5(Uuid5Namespace.URL);
/**
 * Derives deterministic UUID version 5 values in the standard OID namespace.
 * @remarks
 * ## Why
 * The pre-bound helper prevents accidental namespace selection drift for object identifiers.
 * ## Ownership and lifetime
 * This function acquires no persistent resources and uses a captured namespace copy for module lifetime.
 * @example
 * ```ts
 * import { oidUuid5 } from "@typed/id/Uuid5"
 * const id = oidUuid5("1.3.6.1.4.1")
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const oidUuid5 = uuid5(Uuid5Namespace.OID);
/**
 * Derives deterministic UUID version 5 values in the standard X.500 namespace.
 * @remarks
 * ## Why
 * The pre-bound helper prevents accidental namespace selection drift for X.500 identities.
 * ## Ownership and lifetime
 * This function acquires no persistent resources and uses a captured namespace copy for module lifetime.
 * @example
 * ```ts
 * import { x500Uuid5 } from "@typed/id/Uuid5"
 * const id = x500Uuid5("CN=example")
 * ```
 * @category ID generation
 * @since 1.0.0
 */
export const x500Uuid5 = uuid5(Uuid5Namespace.X500);

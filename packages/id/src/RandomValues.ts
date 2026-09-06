import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Random from "effect/Random";
import * as Context from "effect/Context";

const allocate = <const N extends number>(
  length: N,
  fill: (view: Uint8Array<ArrayBuffer>) => void,
): Uint8Array & { readonly length: N } => {
  const view = new Uint8Array(length);
  fill(view);
  return view as Uint8Array & { readonly length: N };
};

const fillFromWebCrypto = (view: Uint8Array<ArrayBuffer>) => {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.getRandomValues !== "function") {
    throw new TypeError(
      "RandomValues.Default requires globalThis.crypto.getRandomValues. Provide RandomValues.Random or a custom RandomValues service for unsupported runtimes.",
    );
  }
  void webCrypto.getRandomValues(view);
};

const fromRandom = (random: (typeof Random.Random)["Service"]): RandomValues["Service"] =>
  RandomValues.of(
    <const N extends number>(length: N): Effect.Effect<Uint8Array & { readonly length: N }> =>
      Effect.sync(() =>
        allocate(length, (view) => {
          for (let i = 0; i < length; ++i) view[i] = random.nextIntUnsafe();
        }),
      ),
  );

/**
 * Effect service that produces fresh byte arrays of an exact requested length.
 * @remarks
 * ## Why
 * Entropy is an explicit dependency so secure production generation and reproducible tests use the same typed generator APIs.
 * `RandomValues.Default` requires `globalThis.crypto.getRandomValues`; an unavailable implementation or thrown platform error is an Effect defect because the service's typed error channel is `never`.
 * ## Ownership and lifetime
 * A Layer owns the entropy source; every call allocates and transfers ownership of a fresh mutable byte array to the caller.
 * @example
 * ```ts
 * import { RandomValues } from "@typed/id/RandomValues"
 * import { Effect } from "effect"
 * const bytes = Effect.provide(RandomValues.call(16), RandomValues.Default)
 * ```
 * @category Entropy services
 * @since 1.0.0
 */
export class RandomValues extends Context.Service<RandomValues>()("@typed/id/RandomValues", {
  make: Effect.succeed(
    <const N extends number>(length: N): Effect.Effect<Uint8Array & { readonly length: N }> =>
      Effect.sync(() => allocate(length, fillFromWebCrypto)),
  ),
}) {
  /**
   * Requests a fresh byte array from the current RandomValues service.
   * @remarks
   * ## Why
   * The static call preserves literal length in the type while keeping the entropy source in Effect's service channel.
   * ## Ownership and lifetime
   * Each invocation allocates a new buffer owned by the caller and acquires no persistent resource.
   * @example
   * ```ts
   * import { RandomValues } from "@typed/id/RandomValues"
   * import { Effect } from "effect"
   * const bytes = RandomValues.call(32).pipe(Effect.provide(RandomValues.Default))
   * ```
   * @category Entropy services
   * @since 1.0.0
   */
  static override readonly call = <const N extends number>(
    length: N,
  ): Effect.Effect<Uint8Array & { readonly length: N }, never, RandomValues> =>
    RandomValues.pipe(Effect.flatMap((randomValues) => randomValues(length)));

  /**
   * Provides cryptographic bytes from `globalThis.crypto.getRandomValues`.
   * @remarks
   * ## Why
   * Production IDs need platform entropy. Missing `globalThis.crypto.getRandomValues` and platform exceptions are Effect defects, not typed errors, rather than silently weakening randomness.
   * ## Ownership and lifetime
   * The Layer owns no mutable generator state; each request returns a fresh buffer. The runtime must provide Web Crypto or the request defects.
   * @category Entropy layers
   * @since 1.0.0
   */
  static readonly Default = Layer.effect(RandomValues, RandomValues.make);

  /**
   * Provides reproducible bytes from Effect Random.
   * @remarks
   * ## Why
   * Deterministic tests and simulations need replaceable entropy; this Layer is not cryptographically secure.
   * ## Ownership and lifetime
   * The provided Effect Random service owns sequence state for the Layer lifetime; each request returns a fresh buffer.
   * @category Entropy layers
   * @since 1.0.0
   */
  static readonly Random = Layer.effect(
    RandomValues,
    Effect.gen(function* () {
      const random = yield* Random.Random;
      return fromRandom(random);
    }),
  );
}

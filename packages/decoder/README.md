# @typed/decoder

This module provides an interface `Decoder<I, O>` much like the experimental module from [io-ts](https://github.com/gcanti/io-ts)
with support for fp-ts v3 including [@effect/schema](https://github.com/fp-ts/schema). It's signature follows directly that of
`@effect/schema`'s output from `Parser.decode(Schema)` allowing for seamless interoperation from Schema to Decoder. Once
in Decoder land, you can compose into larger Decoders and apply transformations to its output using its
[Covariant](https://fp-ts.github.io/core/modules/typeclass/Covariant.ts.html) instance instead of the
[Invariant](https://fp-ts.github.io/core/modules/typeclass/Invariant.ts.html) instance of Schema. Because of this
difference, it is not usually possible to go back to a Schema unless it was created directly using `fromSchema<A>(schema: Schema<A>): SchemaDecoder<A>`.

---
title: index.ts
nav_order: 1
parent: "@typed/decoder"
---

## index overview

Decoder is a small extension of @effect/Schema which enables the ability to transform the
output values independently of encoding.

It is important to note that this library is not intended to be used without @effect/schema,
and thus does not provide string/number Decoders or any other built-in Decoders. Instead,
you can pass Schema's directly to all functions which accept Decoders and it will be converted
to a Decoder, and cached, automatically.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Decoder (interface)](#decoder-interface)
  - [DecoderTypeId](#decodertypeid)
  - [DecoderTypeId (type alias)](#decodertypeid-type-alias)
  - [compose](#compose)
  - [fromSchema](#fromschema)
  - [getDecoder](#getdecoder)
  - [isDecoder](#isdecoder)
  - [make](#make)
  - [map](#map)
  - [mapEffect](#mapeffect)

---

# utils

## Decoder (interface)

Decoder is a small extension of @effect/Schema which enables the ability to transform the
output values independently of encoding.

**Signature**

```ts
export interface Decoder<I, O, E = never, R = never> {
  readonly [DecoderTypeId]: DecoderTypeId
  readonly decode: (input: I, options?: ParseOptions) => Effect.Effect<O, E, R>
  readonly options?: ParseOptions | undefined
}
```

Added in v1.0.0

## DecoderTypeId

**Signature**

```ts
export declare const DecoderTypeId: typeof DecoderTypeId
```

Added in v1.0.0

## DecoderTypeId (type alias)

**Signature**

```ts
export type DecoderTypeId = typeof DecoderTypeId
```

Added in v1.0.0

## compose

Pipe the output of a Decoder/Schema into another Decoder/Schema for transformation

**Signature**

```ts
export declare const compose: {
  <O, B, E2, R2>(
    to: Decoder<O, B, E2, R2>
  ): {
    <I, R, E>(from: Decoder<I, O, E, R>): Decoder<I, B, E | E2, R | R2>
    <I, R>(from: Schema.Schema<O, I, R>): Decoder<I, B, E2 | ParseError, R>
    <I, R, E>(from: Decoder<I, O, E, R> | Schema.Schema<O, I, R>): Decoder<I, B, E | E2 | ParseError, R | R2>
  }
  <O, B>(
    to: Schema.Schema<O, B>
  ): {
    <I, R, E>(from: Decoder<I, O, E, R>): Decoder<I, B, E | ParseError, R>
    <I, R>(from: Schema.Schema<O, I, R>): Decoder<I, B, ParseError>
    <I, R, E>(from: Decoder<I, O, E, R> | Schema.Schema<O, I, R>): Decoder<I, R, E | ParseError, B>
  }
  <O, B, E2, R2>(
    to: Decoder<O, B, E2, R2> | Schema.Schema<B, O, R2>
  ): {
    <I, R, E>(from: Decoder<I, O, E, R>): Decoder<I, R | R2, E | E2 | ParseError, B>
    <I, R>(from: Schema.Schema<I, O, R>): Decoder<I, B, E2 | ParseError, R>
    <I, R, E>(from: Decoder<I, O, E, R> | Schema.Schema<I, O>): Decoder<I, R | R2, E | E2 | ParseError, B>
  }
  <I, R, E, O, B, E2, R2>(from: Decoder<I, O, E, R>, to: Decoder<O, B, E2, R2>): Decoder<I, B, E | E2, R | R2>
  <O, I, R, B, E2, R2>(from: Schema.Schema<O, I, R>, to: Decoder<O, B, E2, R2>): Decoder<I, B, E2 | ParseError, R | R2>
  <I, R, E, R2, O, B>(from: Decoder<I, O, E, R>, to: Schema.Schema<B, O, R2>): Decoder<I, B, E | ParseError, R | R2>
  <O, I, R, R2, B>(from: Schema.Schema<O, I, R>, to: Schema.Schema<B, O, R2>): Decoder<I, B, ParseError, R | R2>
  <I, R, E, O, B, E2, R2>(
    from: Decoder<I, O, E, R> | Schema.Schema<O, I, R>,
    to: Decoder<O, B, E2, R2> | Schema.Schema<B, O, R2>
  ): Decoder<I, B, ParseError | E | E2, R | R2>
}
```

Added in v1.0.0

## fromSchema

Lift a Schema<I, O> into a Decoder<I, never, ParseError, O>.

**Signature**

```ts
export declare function fromSchema<O, I, R>(schema: Schema.Schema<O, I, R>): Decoder<I, O, ParseError, R>
```

Added in v1.0.0

## getDecoder

Get a Decoder from a Decoder or Schema.

**Signature**

```ts
export declare const getDecoder: {
  <I, O, E, R>(decoder: Decoder<I, O, E, R>): Decoder<I, O, E, R>
  <O, I, R>(schema: Schema.Schema<O, I, R>): Decoder<I, O, ParseError, R>
  <I, O = never, E = never, R = never>(
    decoder: Decoder<I, O, E, R> | Schema.Schema<O, I, R>
  ): Decoder<I, O, E | ParseError, R>
}
```

Added in v1.0.0

## isDecoder

Check if a value is a Decoder.

**Signature**

```ts
export declare function isDecoder<I = unknown, R = unknown, E = unknown, O = unknown>(
  u: unknown
): u is Decoder<I, O, E, R>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<I, O, E, R>(
  decode: (input: I, options?: ParseOptions) => Effect.Effect<O, E, R>,
  options?: ParseOptions
): Decoder<I, O, E, R>
```

Added in v1.0.0

## map

Transform the output of a Decoder/Schema using a function.

**Signature**

```ts
export declare const map: {
  <O, B>(
    f: (o: O) => B
  ): {
    <I, E, R>(input: Decoder<I, O, E, R>): Decoder<I, B, E, R>
    <I, R>(input: Schema.Schema<O, I, R>): Decoder<I, B, ParseError, R>
    <I, E, R>(input: Decoder<I, O, E, R> | Schema.Schema<O, I, R>): Decoder<I, B, E | ParseError, R>
  }
  <I, O, E, R, B>(input: Decoder<I, O, E, R>, f: (o: O) => B): Decoder<I, B, E, R>
  <O, I, R, B>(input: Schema.Schema<O, I, R>, f: (o: O) => B): Decoder<I, B, ParseError>
  <I, O, E, R, B>(input: Decoder<I, O, E, R> | Schema.Schema<O, I, R>, f: (o: O) => B): Decoder<I, B, ParseError | E, R>
}
```

Added in v1.0.0

## mapEffect

Transform the output of a Decoder/Schema using an Effect.

**Signature**

```ts
export declare const mapEffect: {
  <O, B, E2, R2>(
    f: (value: O) => Effect.Effect<B, E2, R2>
  ): {
    <I, E, R>(input: Decoder<I, O, E, R>): Decoder<I, B, E | E2 | ParseError, R | R2>
    <I, R>(input: Schema.Schema<O, I, R>): Decoder<I, B, E2 | ParseError, R2>
    <I, R, E>(input: Decoder<I, O, E, R> | Schema.Schema<O, I, R>): Decoder<I, B, E | E2 | ParseError, R | R2>
  }
  <I, O, E, R, B, E2, R2>(
    input: Decoder<I, O, E, R>,
    f: (value: O) => Effect.Effect<B, E2, R2>
  ): Decoder<I, B, E | E2 | ParseError, R | R2>
  <O, I, R, B, E2, R2>(
    input: Schema.Schema<O, I, R>,
    f: (value: O) => Effect.Effect<B, E2, R2>
  ): Decoder<I, B, E2 | ParseError, R | R2>
  <I, O, E = never, R = never, B = never, E2 = never, R2 = never>(
    input: Decoder<I, O, E, R> | Schema.Schema<O, I, R>,
    f: (value: O) => Effect.Effect<B, E2, R2>
  ): Decoder<I, B, E | E2 | ParseError, R | R2>
}
```

Added in v1.0.0

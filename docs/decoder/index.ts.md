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
export interface Decoder<I, R, E, O> {
  readonly [DecoderTypeId]: DecoderTypeId
  readonly decode: (input: I, options?: ParseOptions) => Effect.Effect<R, E, O>
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
  <O, R2, E2, B>(
    to: Decoder<O, R2, E2, B>
  ): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R2 | R, E2 | E, B>
    <R, I>(from: Schema.Schema<R, I, O>): Decoder<I, R2, ParseError | E2, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R2 | R, ParseError | E2 | E, B>
  }
  <O, B>(
    to: Schema.Schema<O, B, B>
  ): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R, ParseError | E, B>
    <R, I>(from: Schema.Schema<R, I, O>): Decoder<I, never, ParseError, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R, ParseError | E, B>
  }
  <O, R2, E2, B>(
    to: Decoder<O, R2, E2, B> | Schema.Schema<R2, O, B>
  ): {
    <I, R, E>(from: Decoder<I, R, E, O>): Decoder<I, R2 | R, ParseError | E2 | E, B>
    <I>(from: Schema.Schema<I, O, O>): Decoder<I, R2, ParseError | E2, B>
    <I, R, E>(from: Decoder<I, R, E, O> | Schema.Schema<I, O, O>): Decoder<I, R2 | R, ParseError | E2 | E, B>
  }
  <I, R, E, O, R2, E2, B>(from: Decoder<I, R, E, O>, to: Decoder<O, R2, E2, B>): Decoder<I, R | R2, E | E2, B>
  <R, I, O, R2, E2, B>(from: Schema.Schema<R, I, O>, to: Decoder<O, R2, E2, B>): Decoder<I, R | R2, ParseError | E2, B>
  <I, R, E, R2, O, B>(from: Decoder<I, R, E, O>, to: Schema.Schema<R2, O, B>): Decoder<I, R | R2, ParseError | E, B>
  <R, I, O, R2, B>(from: Schema.Schema<R, I, O>, to: Schema.Schema<R2, O, B>): Decoder<I, R | R2, ParseError, B>
  <I, R, E, O, R2, E2, B>(
    from: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
    to: Decoder<O, R2, E2, B> | Schema.Schema<R2, O, B>
  ): Decoder<I, R | R2, ParseError | E | E2, B>
}
```

Added in v1.0.0

## fromSchema

Lift a Schema<I, O> into a Decoder<I, never, ParseError, O>.

**Signature**

```ts
export declare function fromSchema<R, I, O>(schema: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, O>
```

Added in v1.0.0

## getDecoder

Get a Decoder from a Decoder or Schema.

**Signature**

```ts
export declare const getDecoder: {
  <I, R, E, O>(decoder: Decoder<I, R, E, O>): Decoder<I, R, E, O>
  <R, I, O>(schema: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, O>
  <I, R = never, E = never, O = never>(
    decoder: Decoder<I, R, E, O> | Schema.Schema<R, I, O>
  ): Decoder<I, R, ParseError | E, O>
}
```

Added in v1.0.0

## isDecoder

Check if a value is a Decoder.

**Signature**

```ts
export declare function isDecoder<I = unknown, R = unknown, E = unknown, O = unknown>(
  u: unknown
): u is Decoder<I, R, E, O>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<I, R, E, O>(
  decode: (input: I, options?: ParseOptions) => Effect.Effect<R, E, O>,
  options?: ParseOptions
): Decoder<I, R, E, O>
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
    <I, R, E>(input: Decoder<I, R, E, O>): Decoder<I, R, E, B>
    <R, I>(input: Schema.Schema<R, I, O>): Decoder<I, R, ParseError, B>
    <I, R, E>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R, ParseError | E, B>
  }
  <I, R, E, O, B>(input: Decoder<I, R, E, O>, f: (o: O) => B): Decoder<I, R, E, B>
  <R, I, O, B>(input: Schema.Schema<R, I, O>, f: (o: O) => B): Decoder<I, never, ParseError, B>
  <I, R, E, O, B>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>, f: (o: O) => B): Decoder<I, R, ParseError | E, B>
}
```

Added in v1.0.0

## mapEffect

Transform the output of a Decoder/Schema using an Effect.

**Signature**

```ts
export declare const mapEffect: {
  <O, R2, E2, B>(
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): {
    <I, R, E>(input: Decoder<I, R, E, O>): Decoder<I, R2 | R, E2 | E | ParseError, B>
    <R, I>(input: Schema.Schema<R, I, O>): Decoder<I, R2, E2 | ParseError, B>
    <I, R, E>(input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>): Decoder<I, R2 | R, E2 | ParseError | E, B>
  }
  <I, R, E, O, R2, E2, B>(
    input: Decoder<I, R, E, O>,
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): Decoder<I, R | R2, E | E2 | ParseError, B>
  <R, I, O, R2, E2, B>(
    input: Schema.Schema<R, I, O>,
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): Decoder<I, R | R2, E2 | ParseError, B>
  <I, R = never, E = never, O = never, R2 = never, E2 = never, B = never>(
    input: Decoder<I, R, E, O> | Schema.Schema<R, I, O>,
    f: (value: O) => Effect.Effect<R2, E2, B>
  ): Decoder<I, R | R2, E | E2 | ParseError, B>
}
```

Added in v1.0.0

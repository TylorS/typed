import { Channel, Effect, Either, Equal, Hash, Inspectable, Sink, STM, Stream } from "effect"

import type { Decoder } from "@typed/decoder/decoder"
import { any, literal } from "@typed/decoder/primitives"
import { struct } from "@typed/decoder/struct"
import { union } from "@typed/decoder/union"

export const right = <A, E = never>(member: Decoder<unknown, A>): Decoder<unknown, Either.Right<E, A>> =>
  struct({
    _tag: literal("Right"),
    _op: literal("Right"),
    right: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    [Effect.EffectTypeId]: any,
    [Either.TypeId]: any,
    _id: any,
    pipe: any,
    toJSON: any,
    [Inspectable.NodeInspectSymbol]: any,
    [Channel.ChannelTypeId]: any,
    [Sink.SinkTypeId]: any,
    [STM.STMTypeId]: any,
    [Stream.StreamTypeId]: any
  })

export const left = <E, A = never>(member: Decoder<unknown, E>): Decoder<unknown, Either.Left<E, A>> =>
  struct({
    _tag: literal("Left"),
    _op: literal("Left"),
    left: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    toJSON: any,
    [Either.TypeId]: any,
    _id: any,
    pipe: any,
    [Inspectable.NodeInspectSymbol]: any,
    [Effect.EffectTypeId]: any,
    [Channel.ChannelTypeId]: any,
    [Sink.SinkTypeId]: any,
    [STM.STMTypeId]: any,
    [Stream.StreamTypeId]: any
  })

export const either = <A, B>(l: Decoder<unknown, A>, r: Decoder<unknown, B>): Decoder<unknown, Either.Either<A, B>> =>
  union(left(l), right(r))

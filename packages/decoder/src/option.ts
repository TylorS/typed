import { Channel, Effect, Equal, Hash, Inspectable, Option, Sink, STM, Stream } from "effect"

import type { Decoder } from "@typed/decoder/decoder"
import { any, literal } from "@typed/decoder/primitives"
import { struct } from "@typed/decoder/struct"
import { union } from "@typed/decoder/union"

export const some = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Some<A>> =>
  struct({
    _tag: literal("Some"),
    _op: literal("Some"),
    value: member,
    [Equal.symbol]: any,
    [Hash.symbol]: any,
    [Option.TypeId]: any,
    [Effect.EffectTypeId]: any,
    _id: any,
    pipe: any,
    toJSON: any,
    [Inspectable.NodeInspectSymbol]: any,
    [Channel.ChannelTypeId]: any,
    [Sink.SinkTypeId]: any,
    [STM.STMTypeId]: any,
    [Stream.StreamTypeId]: any
  })

export const none: Decoder<unknown, Option.None<never>> = struct({
  _tag: literal("None"),
  _op: literal("None"),
  [Equal.symbol]: any,
  [Hash.symbol]: any,
  [Option.TypeId]: any,
  [Effect.EffectTypeId]: any,
  _id: any,
  pipe: any,
  toJSON: any,
  [Inspectable.NodeInspectSymbol]: any,
  [Channel.ChannelTypeId]: any,
  [Sink.SinkTypeId]: any,
  [STM.STMTypeId]: any,
  [Stream.StreamTypeId]: any
})

export const option = <A>(member: Decoder<unknown, A>): Decoder<unknown, Option.Option<A>> => union(some(member), none)

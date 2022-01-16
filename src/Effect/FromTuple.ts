import { Effect, ErrorOf, OutputOf, ResourcesOf } from './Effect'
import { instr } from './Instruction'

export class FromTuple<
  Effects extends ReadonlyArray<Effect<any, never, any> | Effect<any, any, any>>,
> extends instr('FromTuple')<
  Effects,
  TupleResources<Effects>,
  TupleErrors<Effects>,
  TupleOutput<Effects>
> {}

export const tuple = <
  Effects extends ReadonlyArray<Effect<any, never, any> | Effect<any, any, any>>,
>(
  effects: Effects,
  trace?: string,
) => new FromTuple(effects, trace)

export type TupleResources<Effects extends readonly any[]> = ToIntersection<{
  [K in keyof Effects]: ResourcesOf<Effects[K]>
}>

export type ToIntersection<T extends readonly any[], R = unknown> = T extends readonly [
  infer Head,
  ...infer Tail
]
  ? ToIntersection<Tail, R & Head>
  : R

export type TupleErrors<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: ErrorOf<Effects[K]>
}[number]

export type TupleOutput<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: OutputOf<Effects[K]>
}

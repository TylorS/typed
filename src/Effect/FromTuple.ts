import { Effect, ErrorOf, OutputOf, ResourcesOf } from './Effect'
import { instr } from './Instruction'
import { ToIntersection } from './ToIntersection'

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

export type TupleErrors<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: ErrorOf<Effects[K]>
}[number]

export type TupleOutput<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: OutputOf<Effects[K]>
}

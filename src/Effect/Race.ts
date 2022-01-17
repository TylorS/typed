import { Effect, ErrorOf, OutputOf, ResourcesOf } from './Effect'
import { instr } from './Instruction'
import { ToIntersection } from './ToIntersection'

export class Race<
  Effects extends ReadonlyArray<Effect<any, never, any> | Effect<any, any, any>>,
> extends instr('Race')<
  Effects,
  RaceResources<Effects>,
  RaceErrors<Effects>,
  RaceOutput<Effects>
> {}

export const race = <
  Effects extends ReadonlyArray<Effect<any, never, any> | Effect<any, any, any>>,
>(
  effects: Effects,
  trace?: string,
) => new Race(effects, trace)

export type RaceResources<Effects extends readonly any[]> = ToIntersection<{
  [K in keyof Effects]: ResourcesOf<Effects[K]>
}>

export type RaceErrors<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: ErrorOf<Effects[K]>
}[number]

export type RaceOutput<Effects extends ReadonlyArray<Effect<any, any, any>>> = {
  [K in keyof Effects]: OutputOf<Effects[K]>
}[number]

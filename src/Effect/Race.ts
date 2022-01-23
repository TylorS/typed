import { ErrorOf, Fx, OutputOf, ResourcesOf } from '@/Fx'

import { instr } from './Instruction'
import { ToIntersection } from './ToIntersection'

export class Race<Fxs extends ReadonlyArray<Fx<any, never, any> | Fx<any, any, any>>> extends instr(
  'Race',
)<Fxs, RaceResources<Fxs>, RaceErrors<Fxs>, RaceOutput<Fxs>> {}

export const race = <Fxs extends ReadonlyArray<Fx<any, never, any> | Fx<any, any, any>>>(
  Fxs: Fxs,
  trace?: string,
) => new Race(Fxs, trace)

export type RaceResources<Fxs extends readonly any[]> = ToIntersection<{
  [K in keyof Fxs]: ResourcesOf<Fxs[K]>
}>

export type RaceErrors<Fxs extends ReadonlyArray<Fx<any, any, any>>> = {
  [K in keyof Fxs]: ErrorOf<Fxs[K]>
}[number]

export type RaceOutput<Fxs extends ReadonlyArray<Fx<any, any, any>>> = {
  [K in keyof Fxs]: OutputOf<Fxs[K]>
}[number]

import { ErrorOf, Fx, OutputOf, ResourcesOf } from '@/Fx'

import { instr } from './Instruction'
import { ToIntersection } from './ToIntersection'

export class FromTuple<
  Fxs extends ReadonlyArray<Fx<any, never, any> | Fx<any, any, any>>,
> extends instr('FromTuple')<Fxs, TupleResources<Fxs>, TupleErrors<Fxs>, TupleOutput<Fxs>> {}

export const tuple = <Fxs extends ReadonlyArray<Fx<any, never, any> | Fx<any, any, any>>>(
  Fxs: Fxs,
  trace?: string,
) => new FromTuple(Fxs, trace)

export type TupleResources<Fxs extends readonly any[]> = ToIntersection<{
  [K in keyof Fxs]: ResourcesOf<Fxs[K]>
}>

export type TupleErrors<Fxs extends ReadonlyArray<Fx<any, any, any>>> = {
  [K in keyof Fxs]: ErrorOf<Fxs[K]>
}[number]

export type TupleOutput<Fxs extends ReadonlyArray<Fx<any, any, any>>> = {
  [K in keyof Fxs]: OutputOf<Fxs[K]>
}

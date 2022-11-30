import { Cause } from '@typed/cause'
import { Exit } from '@typed/exit'

import { Effect } from '../effect/Effect.js'

export type FiberFrame =
  | MapFrame
  | TapFrame
  | FlatMapFrame
  | MapCauseFrame
  | TapCauseFrame
  | OrElseCauseFrame
  | EnsuringFrame
  | InterruptFrame
  | PopFrame

export interface MapFrame {
  readonly _tag: 'Map'
  readonly f: (a: any) => any
}

export function MapFrame(f: (a: any) => any): MapFrame {
  return {
    _tag: 'Map',
    f,
  }
}

export interface TapFrame {
  readonly _tag: 'Tap'
  readonly f: (a: any) => Effect<any, any, any>
}

export function TapFrame(f: (a: any) => Effect<any, any, any>): TapFrame {
  return {
    _tag: 'Tap',
    f,
  }
}

export interface FlatMapFrame {
  readonly _tag: 'FlatMap'
  readonly f: (a: any) => Effect<any, any, any>
}

export function FlatMapFrame(f: (a: any) => Effect<any, any, any>): FlatMapFrame {
  return {
    _tag: 'FlatMap',
    f,
  }
}

export interface MapCauseFrame {
  readonly _tag: 'MapCause'
  readonly f: (cause: Cause<any>) => Cause<any>
}

export function MapCauseFrame(f: (cause: Cause<any>) => Cause<any>): MapCauseFrame {
  return {
    _tag: 'MapCause',
    f,
  }
}

export interface TapCauseFrame {
  readonly _tag: 'TapCause'
  readonly f: (cause: Cause<any>) => Effect<any, any, any>
}

export function TapCauseFrame(f: (cause: Cause<any>) => Effect<any, any, any>): TapCauseFrame {
  return {
    _tag: 'TapCause',
    f,
  }
}

export interface OrElseCauseFrame {
  readonly _tag: 'OrElseCause'
  readonly f: (cause: Cause<any>) => Effect<any, any, any>
}

export function OrElseCauseFrame(
  f: (cause: Cause<any>) => Effect<any, any, any>,
): OrElseCauseFrame {
  return {
    _tag: 'OrElseCause',
    f,
  }
}

export interface EnsuringFrame {
  readonly _tag: 'Ensuring'
  readonly f: (exit: Exit<any, any>) => Effect<any, any, any>
}

export function EnsuringFrame(f: (exit: Exit<any, any>) => Effect<any, any, any>): EnsuringFrame {
  return {
    _tag: 'Ensuring',
    f,
  }
}

export interface InterruptFrame {
  readonly _tag: 'Interrupt'
}

export const InterruptFrame: InterruptFrame = {
  _tag: 'Interrupt',
}

export interface PopFrame {
  readonly _tag: 'Pop'
  readonly pop: () => void
}

export function PopFrame(pop: () => void): PopFrame {
  return {
    _tag: 'Pop',
    pop,
  }
}

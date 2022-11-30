import * as Cause from '@typed/cause'

import { Effect } from './Effect.js'

export type Frame =
  | MapFrame
  | FlatMapFrame
  | MapCauseFrame
  | FlatMapCauseFrame
  | InterruptFrame
  | TraceFrame
  | PopFrame

export class MapFrame {
  readonly tag = 'Map'
  constructor(readonly f: (a: any) => any, readonly __trace?: string) {}
}

export class FlatMapFrame {
  readonly tag = 'FlatMap'
  constructor(readonly f: (a: any) => Effect<any, any, any>, readonly __trace?: string) {}
}

export class MapCauseFrame {
  readonly tag = 'MapCause'
  constructor(readonly f: (a: Cause.Cause<any>) => Cause.Cause<any>, readonly __trace?: string) {}
}

export class FlatMapCauseFrame {
  readonly tag = 'FlatMapCause'
  constructor(
    readonly f: (a: Cause.Cause<any>) => Effect<any, any, any>,
    readonly __trace?: string,
  ) {}
}

export class InterruptFrame {
  readonly tag = 'Interrupt'

  constructor(readonly __trace?: string) {}
}

export class TraceFrame {
  readonly tag = 'Trace'

  constructor(readonly trace: string) {}
}

export class PopFrame {
  readonly tag = 'Pop'
  constructor(readonly f: () => void, readonly __trace?: string) {}
}

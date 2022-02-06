import { Branded } from '@/Branded'
import { pipe } from '@/function'
import * as Fx from '@/Fx'

export interface Layer<R, E, A> {
  readonly id: LayerId
  readonly global: boolean
  readonly overridable: boolean
  readonly provider: Fx.Fx<R, E, A>
}

export type LayerId = Branded<PropertyKey, 'LayerId'>
export const LayerId = Branded<LayerId>()

export type LayerOptions = Partial<Omit<Layer<any, any, any>, 'provider'>>

export function make<R, E, A>(
  provider: Fx.Fx<R, E, A>,
  options: LayerOptions = {},
): Layer<R, E, A> {
  return {
    id: options.id ?? LayerId(Symbol()),
    global: options.global ?? false,
    overridable: options.overridable ?? true,
    provider,
  }
}

export const of = <A>(value: A, options: LayerOptions = {}) => make(Fx.of(value), options)

export function globalize<R, E, A>(layer: Layer<R, E, A>): Layer<R, E, A> {
  return {
    ...layer,
    global: true,
  }
}

export function localize<R, E, A>(layer: Layer<R, E, A>): Layer<R, E, A> {
  return {
    ...layer,
    global: false,
  }
}

export function overridable<R, E, A>(layer: Layer<R, E, A>): Layer<R, E, A> {
  return {
    ...layer,
    overridable: true,
  }
}

export function freeze<R, E, A>(layer: Layer<R, E, A>): Layer<R, E, A> {
  return {
    ...layer,
    overridable: false,
  }
}

export function provideAll<R>(resources: R) {
  return <E, A>(layer: Layer<R, E, A>): Layer<unknown, E, A> => ({
    ...layer,
    provider: pipe(layer.provider, Fx.provideAll(resources)),
  })
}

export function provide<R2>(resources: R2) {
  return <R, E, A>(layer: Layer<R & R2, E, A>): Layer<R, E, A> => ({
    ...layer,
    provider: pipe(layer.provider, Fx.provide(resources)),
  })
}

export function provideWith<R2, E2, R3>(provider: Fx.Fx<R2, E2, R3>) {
  return <R, E, A>(layer: Layer<R & R3, E, A>): Layer<R & R2, E | E2, A> => ({
    ...layer,
    provider: pipe(layer.provider, Fx.provideWith(provider)),
  })
}

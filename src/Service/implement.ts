import { U } from 'ts-toolbelt'
import { Equals } from 'ts-toolbelt/out/Any/Equals'

import { ToIntersection } from '@/Effect/ToIntersection'
import * as Fx from '@/Fx'
import { Has, has } from '@/Has'
import * as Layer from '@/Layer'
import { LayerId } from '@/Layer'
import { pipe } from '@/Prelude/function'

import { Service } from './Service'

export const implement = <Name extends string, A, B extends Extendable<A>>(
  service: Service<Name, A>,
  implementation: B,
): Layer.Layer<ExtractAllResources<B>, ExtractAllErrors<B>, Has<Name, A>> =>
  Layer.make(Fx.of(has(service, implementation as A)), { id: LayerId(service) })

export const implementFx = <Name extends string, A, R, E, B extends Extendable<A>>(
  service: Service<Name, A>,
  implementation: Fx.Fx<R, E, B>,
): Layer.Layer<R & ExtractAllResources<B>, E | ExtractAllErrors<B>, Has<Name, A>> =>
  Layer.make(
    pipe(
      implementation,
      Fx.map((i) => has(service, i as A)),
    ),
    { id: LayerId(service) },
  )

export type Extendable<T> = [T] extends [(...args: infer Args) => Fx.Fx<infer R, infer E, infer A>]
  ? (...args: Args) => Fx.Fx<Equals<R, unknown> extends 1 ? any : R, E, A>
  : [T] extends [Fx.Fx<infer R, infer E, infer A>]
  ? Fx.Fx<Equals<R, unknown> extends 1 ? any : R, E, A>
  : T

type AllResources<A> = [A] extends [Fx.Fx<infer R, infer _, infer _>]
  ? R
  : [A] extends [Layer.Layer<infer R, infer _, infer _>]
  ? R
  : [A] extends [(...args: readonly any[]) => infer T]
  ? AllResources<T>
  : unknown

export type ExtractAllResources<T> = Equals<T, never> extends 1
  ? unknown
  : AllResources<T> &
      ToIntersection<
        U.ListOf<
          {
            readonly [K in keyof T]: K extends keyof T ? ExtractAllResources<T[K]> : unknown
          }[keyof T]
        >
      >

type AllErrors<A> = [A] extends [Fx.Fx<infer _, infer R, infer _>]
  ? R
  : [A] extends [Layer.Layer<infer _, infer R, infer _>]
  ? R
  : [A] extends [(...args: readonly any[]) => infer T]
  ? AllErrors<T>
  : never

export type ExtractAllErrors<T> =
  | AllErrors<T>
  | {
      readonly [K in keyof T]: ExtractAllErrors<T[K]>
    }[keyof T]

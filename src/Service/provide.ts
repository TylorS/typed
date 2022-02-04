import { pipe } from 'fp-ts/function'

import * as Fx from '@/Fx'
import { Has, has } from '@/Has'

import { ExtractAllErrors, ExtractAllResources } from './implement'
import { Service } from './Service'

/**
 * Synchronously provide a Service implementation.
 */
export const provide =
  <Name extends string, A>(service: Service<Name, A>, implementation: A) =>
  <R, E, B>(
    fx: Fx.Fx<R & Has<Name, A>, E, B>,
  ): Fx.Fx<R & ExtractAllResources<A>, E | ExtractAllErrors<A>, B> =>
    pipe(fx, Fx.provide(has(service, implementation)))

/**
 * Asynchronously provide a Service using an Fx.
 */
export const provideWith =
  <Name extends string, R2, E2, A>(service: Service<Name, A>, implementation: Fx.Fx<R2, E2, A>) =>
  <R, E, B>(
    fx: Fx.Fx<R & Has<Name, A>, E, B>,
  ): Fx.Fx<R & R2 & ExtractAllResources<A>, E | E2 | ExtractAllErrors<A>, B> =>
    pipe(
      fx,
      Fx.provideWith<R2, E2, Has<Name, A>>(
        pipe(
          implementation,
          Fx.map((i) => has(service, i)),
        ),
      ),
    )

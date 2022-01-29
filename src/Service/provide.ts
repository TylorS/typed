import { pipe } from 'fp-ts/function'

import * as Fx from '@/Fx'
import { Has, has } from '@/Has'

import { Service } from './Service'

/**
 * Synchronously provide a Service implementation.
 */
export const provide =
  <Name extends string, A>(service: Service<Name, A>, implementation: A) =>
  <R, E, B>(fx: Fx.Fx<R & Has<Name, A>, E, B>): Fx.Fx<R, E, B> =>
    pipe(fx, Fx.provide(has(service, implementation)))

export const provideWith =
  <Name extends string, R2, E2, A>(service: Service<Name, A>, implementation: Fx.Fx<R2, E2, A>) =>
  <R, E, B>(fx: Fx.Fx<R & Has<Name, A>, E, B>): Fx.Fx<R & R2, E | E2, B> =>
    pipe(
      fx,
      Fx.provideWith<R2, E2, Has<Name, A>>(
        pipe(
          implementation,
          Fx.map((i) => has(service, i)),
        ),
      ),
    )

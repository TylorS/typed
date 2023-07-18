import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref'
import * as RefS from '@effect/io/Ref/Synchronized'
import * as Scope from '@effect/io/Scope'

export type ScopedFork = <R2, E2, B>(
  effect: Effect.Effect<R2, E2, B>,
) => Effect.Effect<R2, never, Fiber.RuntimeFiber<E2, B>>

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
) {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => f(Effect.forkIn(scope), scope),
    (scope, exit) => Scope.close(scope, exit),
  )
}

export type ForkFxFiber = <R2>(
  effect: Effect.Effect<R2, never, void>,
) => Effect.Effect<R2, never, Fiber.RuntimeFiber<never, void>>

export function withUnboundedConcurrency<R, E, A>(
  f: (fork: ForkFxFiber) => Effect.Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    Effect.suspend(() => {
      const fibers = new Set<Fiber.RuntimeFiber<never, void>>()

      return Effect.flatMap(
        f((effect) =>
          Effect.flatMap(fork(effect), (fiber) => {
            fibers.add(fiber)
            return Effect.as(
              fork(
                Effect.ensuring(
                  Fiber.join(fiber),
                  Effect.sync(() => fibers.delete(fiber)),
                ),
              ),
              fiber,
            )
          }),
        ),
        () => (fibers.size > 0 ? Fiber.joinAll(fibers) : Effect.unit),
      )
    }),
  )
}

export type ForkFx = <R2>(eff: Effect.Effect<R2, never, void>) => Effect.Effect<R2, never, void>

export function withSwitch<R, E, A>(f: (switchFork: ForkFx) => Effect.Effect<R, E, A>) {
  return withScopedFork((fork) =>
    Effect.flatMap(RefS.make<Fiber.Fiber<never, void> | undefined>(undefined), (ref) => {
      const switchFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
        RefS.updateEffect(ref, (currentFiber) =>
          currentFiber ? Effect.zipRight(Fiber.interruptFork(currentFiber), fork(eff)) : fork(eff),
        )

      return Effect.flatMap(
        Effect.flatMap(f(switchFork), () => RefS.get(ref)),
        (fiber) => (fiber ? Fiber.join(fiber) : Effect.unit),
      )
    }),
  )
}

export function withExhaust<R, E, A>(f: (exhaustFork: ForkFx) => Effect.Effect<R, E, A>) {
  return withScopedFork((fork) =>
    Effect.flatMap(Ref.make<Fiber.Fiber<never, void> | void>(undefined), (ref) => {
      const reset = Ref.set(ref, undefined)

      const exhaustFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
        Effect.flatMap(Ref.get(ref), (currentFiber) =>
          currentFiber
            ? Effect.unit
            : Effect.flatMap(fork(Effect.ensuring(eff, reset)), (fiber) => Ref.set(ref, fiber)),
        )

      return Effect.flatMap(
        Effect.flatMap(f(exhaustFork), () => Ref.get(ref)),
        (fiber) => (fiber ? Fiber.join(fiber) : Effect.unit),
      )
    }),
  )
}

export function withExhaustLatest<R, E, A>(
  f: (exhaustLatestFork: ForkFx) => Effect.Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    Effect.flatMap(
      Effect.zip(
        Ref.make<Fiber.Fiber<never, void> | void>(undefined),
        Ref.make<Option.Option<Effect.Effect<any, never, void>>>(Option.none()),
      ),
      ([ref, nextEffect]) => {
        const reset = Ref.set(ref, undefined)

        // Wait for the current fiber to finish
        const awaitNext = Effect.flatMap(Ref.get(ref), (fiber) =>
          fiber ? Fiber.join(fiber) : Effect.unit,
        )

        // Run the next value that's be saved for replay if it exists

        const runNext: Effect.Effect<any, never, void> = Effect.flatMap(
          Ref.get(nextEffect),
          (next) => {
            if (Option.isNone(next)) {
              return Effect.unit
            }

            return Effect.all([
              // Clear the next A to be replayed
              Ref.set(nextEffect, Option.none()),
              // Replay the next A
              exhaustLatestFork(next.value),
              // Ensure we don't close the scope until the last fiber completes
              awaitNext,
            ])
          },
        )

        const exhaustLatestFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
          Effect.flatMap(Ref.get(ref), (currentFiber) =>
            currentFiber
              ? Ref.set(nextEffect, Option.some(eff))
              : Effect.flatMap(fork(Effect.ensuring(eff, Effect.zip(reset, runNext))), (fiber) =>
                  RefS.set(ref, fiber),
                ),
          )

        return Effect.zip(f(exhaustLatestFork), awaitNext)
      },
    ),
  )
}

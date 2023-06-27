import * as Chunk from '@effect/data/Chunk'
import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { fail, failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { withUnboundedConcurrency } from './helpers.js'

export function catchAllCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx(<R3>(sink: Sink<R3, E2, A | B>) =>
    withUnboundedConcurrency((fork) =>
      fx.run(Sink(sink.event, (cause) => fork(f(cause).run(sink)))),
    ),
  )
}

export function catchAll<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (cause) => pipe(cause, Cause.failureOrCause, Either.match(f, failCause)))
}

export function catchAllCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (e) => fromEffect(f(e)))
}

export function catchAllEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAll(fx, (e) => fromEffect(f(e)))
}

export function catchTag<R, E, A, Tag extends string, R2, E2, B>(
  fx: Fx<R, E, A>,
  tag: Tag,
  f: (e: Extract<E, { readonly _tag: Tag }>) => Fx<R2, E2, B>,
): Fx<R | R2, Exclude<E, { readonly _tag: Tag }> | E2, A | B> {
  return catchAll(
    fx,
    (e): Fx<R | R2, Exclude<E, { readonly _tag: Tag }> | E2, A | B> =>
      isTaggedWith(e, tag) ? f(e) : fail(e as unknown as Exclude<E, { readonly _tag: Tag }>),
  )
}

export function catchAllDefect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: unknown) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return catchAllCause(fx, (cause): Fx<R | R2, E | E2, A | B> => {
    const defects = Cause.defects(cause)

    if (Chunk.size(defects) > 0) {
      return f(Chunk.unsafeHead(defects))
    }

    return failCause(cause)
  })
}

function isTaggedWith<E, Tag extends string>(
  e: E,
  tag: Tag,
): e is Extract<E, { readonly _tag: Tag }> {
  if (!e || typeof e !== 'object' || Array.isArray(e)) {
    return false
  }

  return (e as any)._tag === tag
}

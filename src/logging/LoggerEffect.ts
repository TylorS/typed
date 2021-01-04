import { Effect, effect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'
import { Contravariant2 } from 'fp-ts/Contravariant'
import { Predicate } from 'fp-ts/function'
import { Monoid } from 'fp-ts/Monoid'
import { pipeable } from 'fp-ts/pipeable'
import { getLoggerM } from 'logging-ts'

const loggerM = getLoggerM(effect)

export const URI = '@fp/logging/LoggerEffect'
export type URI = typeof URI

export interface LoggerEffect<E, A> {
  (a: A): Effect<E, void>
}

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    [URI]: LoggerEffect<E, A>
  }
}

/**
 * Filter a LoggerEffect
 */
export const filter = curry(loggerM.filter) as {
  <E, A>(logger: LoggerEffect<E, A>, predicate: Predicate<A>): LoggerEffect<E, A>
  <E, A>(logger: LoggerEffect<E, A>): (predicate: Predicate<A>) => LoggerEffect<E, A>
}

/**
 * Create a Monoid instance for LoggerEffect
 */
export const getMonoid: <E, A>() => Monoid<LoggerEffect<E, A>> = loggerM.getMonoid

/**
 * Contravariant instance for LoggerInstance
 */
export const loggerEffect: Contravariant2<URI> = {
  URI,
  contramap: loggerM.contramap,
}

export const { contramap } = pipeable(loggerEffect)

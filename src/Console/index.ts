import { Effect, fromEnv, sync } from '@typed/fp/Effect'
import { LoggerEffect } from '@typed/fp/logging'

export interface ConsoleEnv {
  readonly console: Console
}

export const withConsole = <A>(f: (c: Console) => A): Effect<ConsoleEnv, A> =>
  fromEnv((e: ConsoleEnv) => sync(f(e.console)))

export const clear = withConsole((c) => c.clear())

export const error: LoggerEffect<ConsoleEnv, string> = (message: string) =>
  withConsole((c) => c.error(message))

export const info: LoggerEffect<ConsoleEnv, string> = (message: string) =>
  withConsole((c) => c.info(message))

export const log: LoggerEffect<ConsoleEnv, string> = (message: string) =>
  withConsole((c) => c.log(message))

export const warn: LoggerEffect<ConsoleEnv, string> = (message: string) =>
  withConsole((c) => c.warn(message))

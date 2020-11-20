import { Effect, fromEnv } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { LoggerEffect } from '@typed/fp/logging/exports'
import { sync } from '@typed/fp/Resume/exports'
import { Show, showString } from 'fp-ts/Show'

export interface ConsoleEnv {
  readonly console: Console
}

/**
 * Perform a synchronous effect using the Console
 */
export const withConsole = <A>(f: (c: Console) => A): Effect<ConsoleEnv, A> =>
  fromEnv((e: ConsoleEnv) => sync(f(e.console)))

/**
 * Creates a LoggerEffect using Console and a Show<A> instance to determine the
 * payload type.
 */
export const createConsoleLogger = curry(
  <A>(type: keyof Console, { show }: Show<A>): LoggerEffect<ConsoleEnv, A> => (a) =>
    withConsole((c) => c[type](show(a))),
) as {
  <A>(type: keyof Console, { show }: Show<A>): LoggerEffect<ConsoleEnv, A>
  (type: keyof Console): <A>({ show }: Show<A>) => LoggerEffect<ConsoleEnv, A>
}

export const clear = withConsole((c) => c.clear())

export const assert = (condition?: boolean, ...data: readonly any[]) =>
  withConsole((c) => c.assert(condition, ...data))

export const groupEnd = withConsole((c) => c.groupEnd())

// Create your own loggers using a custom Show instances

export const createCountLogger = createConsoleLogger('count')
export const createDebugLogger = createConsoleLogger('debug')
export const createDirLogger = createConsoleLogger('dir')
export const createDirXmlLogger = createConsoleLogger('dirxml')
export const createErrorLogger = createConsoleLogger('error')
export const createExceptionLogger = createConsoleLogger('exception')
export const createGroupLogger = createConsoleLogger('group')
export const createGroupCollapsedLogger = createConsoleLogger('groupCollapsed')
export const createInfoLogger = createConsoleLogger('info')
export const createLogLogger = createConsoleLogger('log')
export const createTimeLogger = createConsoleLogger('time')
export const createTimeEndLogger = createConsoleLogger('timeEnd')
export const createTimeLogLogger = createConsoleLogger('timeLog')
export const createTimeStampLogger = createConsoleLogger('timeStamp')
export const createTraceLogger = createConsoleLogger('trace')
export const createWarnLogger = createConsoleLogger('warn')

// Default loggers for just strings

export const count = createCountLogger(showString)
export const debug = createDebugLogger(showString)
export const dir = createDirLogger(showString)
export const dirXml = createDirXmlLogger(showString)
export const error = createErrorLogger(showString)
export const exception = createExceptionLogger(showString)
export const group = createGroupLogger(showString)
export const groupCollapsed = createInfoLogger(showString)
export const info = createInfoLogger(showString)
export const log = createLogLogger(showString)
export const time = createTimeLogger(showString)
export const timeEnd = createTimeEndLogger(showString)
export const timeLog = createTimeLogLogger(showString)
export const timeStamp = createTimeStampLogger(showString)
export const trace = createTraceLogger(showString)
export const warn = createWarnLogger(showString)

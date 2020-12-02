import { Effect, fromEnv } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { LoggerEffect } from '@typed/fp/logging/exports'
import { sync } from '@typed/fp/Resume/exports'
import { Show, showString } from 'fp-ts/Show'

/**
 * An environment which contains a Console as its resource.
 */
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

/**
 * Clear the console.
 */
export const clear = withConsole((c) => c.clear())

/**
 * Assert a condition using the Console API.
 */
export const assert = (condition?: boolean, ...data: readonly any[]) =>
  withConsole((c) => c.assert(condition, ...data))

/**
 * End the current group
 */
export const groupEnd = withConsole((c) => c.groupEnd())

// Create your own loggers using a custom Show instances

/**
 * Provide a Show instance to create a console.count LoggerEffect
 */
export const createCountLogger = createConsoleLogger('count')

/**
 * Provide a Show instance to create a console.debug LoggerEffect
 */
export const createDebugLogger = createConsoleLogger('debug')

/**
 * Provide a Show instance to create a console.dir LoggerEffect
 */
export const createDirLogger = createConsoleLogger('dir')

/**
 * Provide a Show instance to create a console.dirxml LoggerEffect
 */
export const createDirXmlLogger = createConsoleLogger('dirxml')

/**
 * Provide a Show instance to create a console.error LoggerEffect
 */
export const createErrorLogger = createConsoleLogger('error')

/**
 * Provide a Show instance to create a console.exception LoggerEffect
 */
export const createExceptionLogger = createConsoleLogger('exception')

/**
 * Provide a Show instance to create a console.group LoggerEffect
 */
export const createGroupLogger = createConsoleLogger('group')

/**
 * Provide a Show instance to create a console.groupCollapsed LoggerEffect
 */
export const createGroupCollapsedLogger = createConsoleLogger('groupCollapsed')

/**
 * Provide a Show instance to create a console.info LoggerEffect
 */
export const createInfoLogger = createConsoleLogger('info')

/**
 * Provide a Show instance to create a console.log LoggerEffect
 */
export const createLogLogger = createConsoleLogger('log')

/**
 * Provide a Show instance to create a console.time LoggerEffect
 */
export const createTimeLogger = createConsoleLogger('time')

/**
 * Provide a Show instance to create a console.timeEnd LoggerEffect
 */
export const createTimeEndLogger = createConsoleLogger('timeEnd')

/**
 * Provide a Show instance to create a console.timeLog LoggerEffect
 */
export const createTimeLogLogger = createConsoleLogger('timeLog')

/**
 * Provide a Show instance to create a console.timeStamp LoggerEffect
 */
export const createTimeStampLogger = createConsoleLogger('timeStamp')

/**
 * Provide a Show instance to create a console.trace LoggerEffect
 */
export const createTraceLogger = createConsoleLogger('trace')

/**
 * Provide a Show instance to create a console.warn LoggerEffect
 */
export const createWarnLogger = createConsoleLogger('warn')

// Default loggers for just strings

/**
 * Use console.count from ConsoleEnv to log a message
 */
export const count = createCountLogger(showString)

/**
 * Use console.debug from ConsoleEnv to log a message
 */
export const debug = createDebugLogger(showString)

/**
 * Use console.dir from ConsoleEnv to log a message
 */
export const dir = createDirLogger(showString)

/**
 * Use console.dirXml from ConsoleEnv to log a message
 */
export const dirXml = createDirXmlLogger(showString)

/**
 * Use console.error from ConsoleEnv to log a message
 */
export const error = createErrorLogger(showString)

/**
 * Use console.exception from ConsoleEnv to log a message
 */
export const exception = createExceptionLogger(showString)

/**
 * Use console.group from ConsoleEnv to log a message
 */
export const group = createGroupLogger(showString)

/**
 * Use console.groupCollapsed from ConsoleEnv to log a message
 */
export const groupCollapsed = createInfoLogger(showString)

/**
 * Use console.info from ConsoleEnv to log a message
 */
export const info = createInfoLogger(showString)

/**
 * Use console.log from ConsoleEnv to log a message
 */
export const log = createLogLogger(showString)

/**
 * Use console.time from ConsoleEnv to log a message
 */
export const time = createTimeLogger(showString)

/**
 * Use console.timeEnd from ConsoleEnv to log a message
 */
export const timeEnd = createTimeEndLogger(showString)

/**
 * Use console.timeLog from ConsoleEnv to log a message
 */
export const timeLog = createTimeLogLogger(showString)

/**
 * Use console.timeStamp from ConsoleEnv to log a message
 */
export const timeStamp = createTimeStampLogger(showString)

/**
 * Use console.trace from ConsoleEnv to log a message
 */
export const trace = createTraceLogger(showString)

/**
 * Use console.warm from ConsoleEnv to log a message
 */
export const warn = createWarnLogger(showString)

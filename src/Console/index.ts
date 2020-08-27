import { fromEnv, sync } from '@typed/fp/Effect'

export interface ConsoleEnv {
  readonly console: Console
}

export const withConsole = <A>(f: (c: Console) => A) =>
  fromEnv((e: ConsoleEnv) => sync(f(e.console)))
export const clear = withConsole((c) => c.clear())
export const error = (message: string) => withConsole((c) => c.error(message))
export const info = (message: string) => withConsole((c) => c.info(message))
export const log = (message: string) => withConsole((c) => c.log(message))
export const warn = (message: string) => withConsole((c) => c.warn(message))

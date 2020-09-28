import { curry, Curry2 } from '@typed/fp/lambda/exports'

export const test: Curry2<RegExp, string, boolean> = curry((regex: RegExp, str: string): boolean =>
  regex.test(str),
)

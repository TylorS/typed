import { curry } from '@fp/lambda/exports'
import { fromNullable, Option } from 'fp-ts/Option'

export const exec: {
  (regex: RegExp, str: string): Option<RegExpExecArray>
  (regex: RegExp): (str: string) => Option<RegExpExecArray>
} = curry((regex: RegExp, str: string): Option<RegExpExecArray> => fromNullable(regex.exec(str)))

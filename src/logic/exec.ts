import { fromNullable, Option } from 'fp-ts/Option'

export const exec = (regex: RegExp, str: string): Option<RegExpExecArray> =>
  fromNullable(regex.exec(str))

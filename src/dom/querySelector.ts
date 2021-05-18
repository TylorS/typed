import * as E from '@fp/Env'
import { fromNullable } from 'fp-ts/Option'

import { RootElementEnv } from './env'

export const querySelector = <S extends string>(selector: S) =>
  E.asks((e: RootElementEnv) => fromNullable(e.rootElement.querySelector(selector)))

export const querySelectorAll = <S extends string>(selector: S) =>
  E.asks((e: RootElementEnv) => toReadonly(Array.from(e.rootElement.querySelectorAll(selector))))

const toReadonly = <A>(array: Array<A>): ReadonlyArray<A> => array

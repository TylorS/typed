import { deepEqualsEq } from '@typed/fp/common/exports'
import { Pure } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlySet'

import { createShared } from '../core/exports'

export const fromSet = <V>(value: Eq<V> = deepEqualsEq) => <K extends PropertyKey>(key: K) =>
  createShared(
    key,
    Pure.fromIO((): ReadonlySet<V> => new Set()),
    getEq(value),
  )

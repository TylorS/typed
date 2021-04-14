import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import { withGlobalRefs } from '@fp/Global'
import * as R from '@fp/Ref'
import * as WM from '@fp/RefWeakMap'
import * as O from 'fp-ts/Option'

export const SharedReferences = WM.fromValue<object, R.References>(Symbol('SharedReferences'))

export const getSharedReferences = pipe(SharedReferences, R.getRef, withGlobalRefs)

export const getSharedReference = (key: object) =>
  pipe(key, WM.getKv(SharedReferences), withGlobalRefs)

export const setSharedReference = (key: object, value: R.References) =>
  withGlobalRefs(WM.setKv(SharedReferences)(key, value))

export const deleteSharedReference = (key: object) =>
  pipe(key, WM.deleteKv(SharedReferences), withGlobalRefs)

export const getOrCreateSharedReference = (key: object) =>
  pipe(
    key,
    getSharedReference,
    E.chain(O.matchW(() => pipe(setSharedReference(key, R.createReferences())), E.of)),
  )

import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import * as Fx from '@/Fx'
import * as Stream from '@/Stream'

import { Ref } from './Ref'

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E, I>(ref: Ref<R, E, I, A>): Ref<R, E, I, B> => ({
    get: pipe(ref.get, Fx.map(f)),
    has: ref.has,
    update: (g) => pipe(ref.update(flow(f, g)), Fx.map(f)),
    delete: pipe(ref.delete, Fx.map(O.map(f))),
    values: pipe(ref.values, Stream.map(O.map(f))),
  })

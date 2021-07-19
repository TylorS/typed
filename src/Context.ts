import * as C from '@fp/Env'
import * as O from '@fp/Option'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { left, right } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'

export const make = Ref.make

export function get<E, A>(ref: Ref.Ref<E, A>): C.Env<E & Ref.Refs, A> {
  return pipe(
    ref,
    findProviderRefs,
    C.chainW((refs) => pipe(Ref.get(ref), C.useSome(refs))),
  )
}

export function has<E, A>(ref: Ref.Ref<E, A>): C.Env<Ref.Refs, boolean> {
  return pipe(
    ref,
    findProviderRefs,
    C.chainW((refs) => pipe(Ref.has(ref), C.useSome(refs))),
  )
}

export function set<E, A>(ref: Ref.Ref<E, A>) {
  return (value: A): C.Env<E & Ref.Refs, A> => {
    return pipe(
      ref,
      findProviderRefs,
      C.chainW((refs) => pipe(value, Ref.set(ref), C.useSome(refs))),
    )
  }
}

export function update<E, A>(ref: Ref.Ref<E, A>) {
  return <E2>(f: (value: A) => C.Env<E2, A>) => {
    return pipe(
      ref,
      findProviderRefs,
      C.chainW((refs) => pipe(f, Ref.update(ref), C.useSome(refs))),
    )
  }
}

export function remove<E, A>(ref: Ref.Ref<E, A>): C.Env<E & Ref.Refs, O.Option<A>> {
  return pipe(
    ref,
    findProviderRefs,
    C.chainW((refs) => pipe(Ref.remove(ref), C.useSome(refs))),
  )
}

export function listenTo<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, Ref.Event<E, A>> {
  return pipe(ref, findProviderRefs, RS.fromEnv, RS.chainStreamK(Ref.listenTo(ref)))
}

export function listenToValues<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<E & Ref.Refs, A> {
  return pipe(
    ref,
    findProviderRefs,
    RS.fromEnv,
    RS.switchMapW((refs) => pipe(Ref.listenToValues(ref), RS.useSome(refs))),
  )
}

export interface Context<E, A> extends Ref.Wrapped<E, A> {}

export function wrap<E, A>(ref: Ref.Ref<E, A>): Context<E, A> {
  return {
    id: ref.id,
    initial: ref.initial,
    equals: ref.equals,
    get: get(ref),
    has: has(ref),
    set: set(ref),
    update: update(ref),
    remove: remove(ref),
    listen: listenTo(ref),
    values: listenToValues(ref),
  } as const
}

export const create = flow(make, wrap)

/**
 * Traverse up the tree of Refs and parent Refs to find the closest Refs that
 * has reference for a given Ref. This is useful for providing a React-like Context
 * API.
 */
export const findProviderRefs = <E, A>(ref: Ref.Ref<E, A>): C.Env<Ref.Refs, Ref.Refs> => {
  const check = pipe(
    C.Do,
    C.bindW('hasRef', () => Ref.has(ref)),
    C.bindW('refs', () => Ref.getRefs),
  )

  return pipe(
    check,
    C.chainW(
      C.chainRec(({ hasRef, refs }) => {
        if (hasRef || O.isNone(refs.parentRefs)) {
          return C.of(right(refs))
        }

        return pipe(check, C.useSome(refs.parentRefs.value), C.map(left))
      }),
    ),
  )
}

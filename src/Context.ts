import * as E from '@fp/Env'
import { useRef } from '@fp/hooks'
import * as O from '@fp/Option'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { useReaderStream } from '@fp/use'
import { left, right } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'

export const make = Ref.make

/**
 * Given a Ref find the provider for this reference, traversing up a tree of Refs if-needed,
 * and will subscribe to updates
 */
export function use<E, A>(
  ref: Ref.Ref<E, A>,
): E.Env<E & Ref.Refs & SchedulerEnv, Ref.Wrapped<E, A>> {
  return pipe(
    E.Do,
    E.bindW('refs', () => findProviderRefs(ref)),
    E.bindW('wrapped', ({ refs }) => pipe(ref, Ref.wrap, Ref.useSome(refs), E.of)),
    // Create a local reference to the context value so we can update our current environment as well
    E.bindW('ref', ({ wrapped }) => useRef(wrapped.get, wrapped)),
    // Subscribe to all updates and keep our local reference up-to-date so that there
    // are corresponding events in our local Refs environment.
    E.chainFirst(({ wrapped, ref }) =>
      useReaderStream(
        pipe(
          wrapped.listen,
          RS.exhaustMapLatestEnv(
            Ref.matchW(
              flow(ref.set, E.map(O.some)),
              flow(ref.set, E.map(O.some)),
              () => ref.remove,
            ),
          ),
        ),
      ),
    ),
    E.map(({ wrapped }) => wrapped),
  )
}

export function get<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, A> {
  return pipe(
    ref,
    findProviderRefs,
    E.chainW((refs) => pipe(Ref.get(ref), E.useSome(refs))),
  )
}

export function has<E, A>(ref: Ref.Ref<E, A>): E.Env<Ref.Refs, boolean> {
  return pipe(
    ref,
    findProviderRefs,
    E.chainW((refs) => pipe(Ref.has(ref), E.useSome(refs))),
  )
}

export function set<E, A>(ref: Ref.Ref<E, A>) {
  return (value: A): E.Env<E & Ref.Refs, A> => {
    return pipe(
      ref,
      findProviderRefs,
      E.chainW((refs) => pipe(value, Ref.set(ref), E.useSome(refs))),
    )
  }
}

export function update<E, A>(ref: Ref.Ref<E, A>) {
  return <E2>(f: (value: A) => E.Env<E2, A>) => {
    return pipe(
      ref,
      findProviderRefs,
      E.chainW((refs) => pipe(f, Ref.update(ref), E.useSome(refs))),
    )
  }
}

export function remove<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, O.Option<A>> {
  return pipe(
    ref,
    findProviderRefs,
    E.chainW((refs) => pipe(Ref.remove(ref), E.useSome(refs))),
  )
}

export function listenTo<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, Ref.Event<E, A>> {
  return pipe(ref, findProviderRefs, RS.fromEnv, RS.chainStreamK(Ref.listenTo(ref)))
}

export function listenToValues<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, A> {
  return pipe(ref, findProviderRefs, RS.fromEnv, RS.chainStreamK(Ref.listenToValues(ref)))
}

export interface Context<E, A> extends Ref.Wrapped<E, A> {
  readonly use: E.Env<E & Ref.Refs & SchedulerEnv, Ref.Wrapped<E, A>>
}

export function wrap<E, A>(ref: Ref.Ref<E, A>): Context<E, A> {
  return {
    id: ref.id,
    initial: ref.initial,
    equals: ref.equals,
    use: use(ref),
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
export const findProviderRefs = <E, A>(ref: Ref.Ref<E, A>): E.Env<Ref.Refs, Ref.Refs> => {
  const check = pipe(
    E.Do,
    E.bindW('hasRef', () => Ref.has(ref)),
    E.bindW('refs', () => Ref.getRefs),
  )

  return pipe(
    check,
    E.chainW(
      E.chainRec(({ hasRef, refs }) => {
        if (hasRef || O.isNone(refs.parentRefs)) {
          return E.of(right(refs))
        }

        return pipe(check, E.useSome(refs.parentRefs.value), E.map(left))
      }),
    ),
  )
}

import { left, right } from 'fp-ts/Either'
import { EqStrict } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'

import * as E from './Env'
import * as EO from './EnvOption'
import * as O from './Option'
import * as RS from './ReaderStream'
import * as Ref from './Ref'
import { SchedulerEnv } from './Scheduler'
import { useReaderStream } from './use'

/**
 * Context is an alternative implementation of Ref.Wrapped, which will traverse
 * up the tree of Refs until it finds the closest parent, or the current Refs, that contains
 * a value for the given Ref ID. If no parent Refs have any value the root-most Refs will be chosen
 * as the home.
 */
export interface Context<E, A> extends Ref.Reference<E, A> {
  readonly use: E.Env<E & Ref.Refs & SchedulerEnv, A>
}

export function get<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, A> {
  return pipe(ref, Ref.get, withProviderRefs(ref))
}

export function has<E, A>(ref: Ref.Ref<E, A>): E.Env<Ref.Refs, boolean> {
  return pipe(ref, Ref.has, withProviderRefs(ref))
}

export function set<E, A>(ref: Ref.Ref<E, A>) {
  return (value: A): E.Env<E & Ref.Refs, A> => pipe(value, Ref.set(ref), withProviderRefs(ref))
}

export function update<E, A>(ref: Ref.Ref<E, A>) {
  return <E2>(f: (value: A) => E.Env<E2, A>) => pipe(f, Ref.update(ref), withProviderRefs(ref))
}

export function remove<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, O.Option<A>> {
  return pipe(Ref.remove(ref), withProviderRefs(ref))
}

export function listenTo<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, Ref.Event<E, A>> {
  return pipe(ref, Ref.listenTo, withProviderRefsStream(ref))
}

export function listenToValues<E, A>(
  ref: Ref.Ref<E, A>,
): RS.ReaderStream<E & Ref.Refs, O.Option<A>> {
  return pipe(ref, Ref.listenToValues, withProviderRefsStream(ref))
}

/**
 * Allows subscribing to the updates ensuring the current Refs receives all
 * updates from Ancestor.
 */
export function use<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs & SchedulerEnv, A> {
  const useValues = useReaderStream(EqStrict)
  const useReplicateEvents = useReaderStream(EqStrict)

  return pipe(
    E.Do,
    E.bind('currentRefs', () => Ref.getRefs),
    E.bindW('providerRefs', () => findProviderRefs(ref)),
    E.bindW('value', () =>
      pipe(
        useValues(listenToValues(ref), ref.id),
        EO.chainOptionK(identity),
        EO.getOrElseEW(() => get(ref)),
      ),
    ),
    E.chainFirstW(({ currentRefs, providerRefs }) =>
      useReplicateEvents(
        pipe(
          ref,
          listenTo,
          RS.chainEnvK((event) =>
            pipe({ ...event, refs: O.some(providerRefs) }, Ref.sendEvent, E.useSome(currentRefs)),
          ),
        ),
        ref.id,
      ),
    ),
    E.map(({ value }) => value),
  )
}

export function toContext<E, A>(ref: Ref.Ref<E, A>): Context<E, A> {
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
    use: use(ref),
  } as const
}

export const create = flow(Ref.make, toContext)

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
      E.chainRec(({ hasRef, refs }: E.ValueOf<typeof check>) => {
        if (hasRef || O.isNone(refs.parentRefs)) {
          return E.of(right(refs))
        }

        return pipe(check, E.useSome(refs.parentRefs.value), E.map(left))
      }),
    ),
  )
}

export const withProviderRefs =
  <E, A>(ref: Ref.Ref<E, A>) =>
  <E2, B>(env: Ref.Env<E2, B>) =>
    pipe(
      ref,
      findProviderRefs,
      E.chainW((refs) => pipe(env, E.useSome(refs))),
    )

export const withProviderRefsStream =
  <E, A>(ref: Ref.Ref<E, A>) =>
  <E2, B>(rs: Ref.ReaderStream<E2, B>) =>
    pipe(
      ref,
      findProviderRefs,
      RS.fromEnv,
      RS.switchMapW((refs) => pipe(rs, RS.useSome(refs))),
    )

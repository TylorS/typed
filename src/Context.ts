/**
 * Context is built atop of @see Reference layering on the capability to traverse
 * up to ancestor environments to share state amongst multiple components.
 *
 * @since 0.9.2
 */
import { left, right } from 'fp-ts/Either'
import { flow, identity, pipe } from 'fp-ts/function'

import * as E from './Env'
import * as EO from './EnvOption'
import * as O from './Option'
import * as RS from './ReaderStream'
import * as Ref from './Ref'
import { SchedulerEnv } from './Scheduler'
import { useReaderStream } from './use'

/**
 * Context is an alternative implementation of Ref.Reference, which will traverse
 * up the tree of Refs until it finds the closest parent, or the current Refs, that contains
 * a value for the given Ref ID. If no parent Refs have any value the root-most Refs will be chosen
 * as the home.
 * @since 0.9.2
 * @category Model
 */
export interface Context<E, A> extends Ref.Reference<E, A> {
  readonly use: E.Env<E & Ref.Refs & SchedulerEnv, A>
}

/**
 * Traverse up the graph of Refs to find the closest ancestor containing
 * this ref to retrieve its value.
 * @since 0.9.2
 * @category Combinator
 */
export function get<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, A> {
  return pipe(ref, Ref.get, withProviderRefs(ref))
}

/**
 * Traverse up the graph of Refs to find if any ancestor is holding this value.
 * @since 0.9.2
 * @category Combinator
 */
export function has<E, A>(ref: Ref.Ref<E, A>): E.Env<Ref.Refs, boolean> {
  return pipe(ref, Ref.has, withProviderRefs(ref))
}

/**
 * Traverse up the graph of Refs to find if the closest ancestor holding this value to
 * set that value to something new.
 * @since 0.9.2
 * @category Combinator
 */
export function set<E, A>(ref: Ref.Ref<E, A>) {
  return (value: A): E.Env<E & Ref.Refs, A> => pipe(value, Ref.set(ref), withProviderRefs(ref))
}

/**
 * Traverse up the graph of Refs to find if the closest ancestor holding this value to
 * update that value by applying an Env-based workflow.
 * @since 0.9.2
 * @category Combinator
 */
export function update<E, A>(ref: Ref.Ref<E, A>) {
  return <E2>(f: (value: A) => E.Env<E2, A>) => pipe(f, Ref.update(ref), withProviderRefs(ref))
}

/**
 * Traverse up the graph of Refs to find if the closest ancestor holding this value to
 * remove it.
 * @since 0.9.2
 * @category Combinator
 */
export function remove<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs, O.Option<A>> {
  return pipe(Ref.remove(ref), withProviderRefs(ref))
}

/**
 * Traverse up the graph of Refs to find if the closest ancestor holding this value to
 * listen to events regarding it's current state.
 * @since 0.9.2
 * @category Combinator
 */
export function listenTo<E, A>(ref: Ref.Ref<E, A>): RS.ReaderStream<Ref.Refs, Ref.Event<E, A>> {
  return pipe(ref, Ref.listenTo, withProviderRefsStream(ref))
}

/**
 * Traverse up the graph of Refs to find if the closest ancestor holding this value to
 * listen to the current value.
 * @since 0.9.2
 * @category Combinator
 */
export function listenToValues<E, A>(
  ref: Ref.Ref<E, A>,
): RS.ReaderStream<E & Ref.Refs, O.Option<A>> {
  return pipe(ref, Ref.listenToValues, withProviderRefsStream(ref))
}

/**
 * Allows subscribing to the updates ensuring the current Refs receives all
 * updates from an Ancestor.
 * @since 0.9.2
 * @category Combinator
 */
export function use<E, A>(ref: Ref.Ref<E, A>): E.Env<E & Ref.Refs & SchedulerEnv, A> {
  const useValues = useReaderStream()
  const useReplicateEvents = useReaderStream()

  return pipe(
    E.Do,
    E.bind('currentRefs', () => Ref.getRefs),
    E.bindW('providerRefs', () => findProviderRefs(ref)),
    E.bindW('value', ({ providerRefs }) =>
      pipe(
        useValues(pipe(ref, Ref.listenToValues, RS.useSome(providerRefs))),
        EO.chainOptionK(identity),
        EO.getOrElseEW(() => pipe(ref, Ref.get, E.useSome(providerRefs))),
      ),
    ),
    E.chainFirstW(({ currentRefs, providerRefs }) =>
      useReplicateEvents(
        pipe(
          ref,
          Ref.listenTo,
          RS.useSome(providerRefs),
          RS.chainEnvK((event) =>
            pipe({ ...event, refs: O.some(providerRefs) }, Ref.sendEvent, E.useSome(currentRefs)),
          ),
        ),
      ),
    ),
    E.map(({ value }) => value),
  )
}

/**
 * Construct a Context from a Ref.
 * @since 0.9.2
 * @category Combinator
 */
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

/**
 * Construct a Context
 * @since 0.9.2
 * @category Constructor
 */
export const create = flow(Ref.make, toContext)

/**
 * Traverse up the tree of Refs and parent Refs to find the closest Refs that
 * has reference for a given Ref. This is useful for providing a React-like Context
 * API.
 * @since 0.9.2
 * @category Combinator
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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const withProviderRefs =
  <E, A>(ref: Ref.Ref<E, A>) =>
  <E2, B>(env: Ref.Env<E2, B>) =>
    pipe(
      ref,
      findProviderRefs,
      E.chainW((refs) => pipe(env, E.useSome(refs))),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const withProviderRefsStream =
  <E, A>(ref: Ref.Ref<E, A>) =>
  <E2, B>(rs: Ref.ReaderStream<E2, B>) =>
    pipe(
      ref,
      findProviderRefs,
      RS.fromEnv,
      RS.switchMapW((refs) => pipe(rs, RS.useSome(refs))),
    )

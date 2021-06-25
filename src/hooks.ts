import * as E from '@fp/Env'
import { flow, increment, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as N from '@fp/number'
import * as Ref from '@fp/Ref'
import { EqStrict } from 'fp-ts/Eq'

import { alwaysEqualsEq, Eq } from './Eq'
import * as RS from './ReaderStream'
import * as S from './Stream'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), Symbol('HookIndex'), alwaysEqualsEq)

const incrementIndex = HookIndex.update(flow(increment, E.of))

const getOrCreateHookId = Ref.memo<symbol>()(N.Eq, Symbol('HookIds'))

const getOrCreateHookRef = Ref.memo<Ref.Wrapped<any, any>>()(
  EqStrict as Eq<symbol>,
  Symbol('HookRefs'),
)

// Get the next ID to use
export const getNextId = Do(function* (_) {
  const currentIndex = yield* _(HookIndex.get)
  const id = yield* _(
    getOrCreateHookId(
      currentIndex,
      E.fromIO(() => Symbol(currentIndex)),
    ),
  )

  yield* _(incrementIndex)

  return id
})

// Reset hook index to support re-rendering or similar workflows.
export const resetId = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(initial: E.Env<E, A>, eq: Eq<A> = alwaysEqualsEq) =>
  Do(function* (_) {
    const id = yield* _(getNextId)

    return (yield* _(getOrCreateHookRef(id, createHookRef(id, initial, eq)))) as Ref.Wrapped<E, A>
  })

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  id: symbol,
  initial: E.Env<E, A>,
  eq: Eq<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> => {
  return Do(function* (_) {
    const { getRef, hasRef, setRef, removeRef, refEvents } = yield* _(E.ask<Ref.Refs>())
    const refs: Ref.Refs = { getRef, hasRef, setRef, removeRef, refEvents }
    const ref = Ref.create(initial, id, eq)

    return {
      id: ref.id,
      initial: ref.initial,
      equals: ref.equals,
      get: pipe(ref.get, E.useSome(refs)),
      has: pipe(ref.has, E.useSome(refs)),
      set: flow(ref.set, E.useSome(refs)),
      update: flow(ref.update, E.useSome(refs)),
      remove: pipe(ref.remove, E.useSome(refs)),
    }
  })
}

export const withHooks = <E, A>(env: E.Env<E, A>): RS.ReaderStream<E & Ref.Events & Ref.Set, A> => {
  const main = Do(function* (_) {
    yield* _(resetId)

    return yield* _(env)
  })

  return pipe(
    RS.fromEnv(main),
    RS.merge((e: E & Ref.Events & Ref.Set) =>
      pipe(
        e.refEvents[1],
        S.filter((x: Ref.Event<any, any>) => x._tag !== 'Created'),
        S.chain(() => pipe(e, main, S.fromResume)),
      ),
    ),
  )
}

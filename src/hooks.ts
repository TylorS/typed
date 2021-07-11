import * as E from '@fp/Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from '@fp/Eq'
import { flow, increment, pipe } from '@fp/function'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefArray from '@fp/RefArray'
import * as RefDisposable from '@fp/RefDisposable'
import * as RefMap from '@fp/RefMap'
import * as RefMapM from '@fp/RefMapM'
import { exec } from '@fp/REsume'
import * as S from '@fp/Stream'
import { disposeAll, disposeBoth, disposeNone } from '@most/disposable'
import { asap, schedulerRelativeTo } from '@most/scheduler'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'
import { lookup } from 'fp-ts/ReadonlyMap'

const INITIAL_HOOK_INDEX = 0

const HookIndex = Ref.create(E.of(INITIAL_HOOK_INDEX), {
  id: Symbol('HookIndex'),
  eq: alwaysEqualsEq,
})

const incrementIndex = HookIndex.update(flow(increment, E.of))

const HookRefs = RefMapM.create(
  E.fromIO(() => new Map<number, any>()),
  {
    id: Symbol('HookRefs'),
    keyEq: N.Eq,
    eq: alwaysEqualsEq,
  },
)

// Get the next ID to use
export const getHookIndex = pipe(
  HookIndex.get,
  E.chainFirst(() => incrementIndex),
)

// Reset hook index to support re-rendering or similar workflows.
export const resetIndex = HookIndex.set(INITIAL_HOOK_INDEX)

// The basis for creating all other hooks-related functionality as it replaces the mechanism for
// generating a Ref's ID to being based on an index that leads to React's "rules of hooks" where order
// matters and they cannot be nested within other hooks without providing separate Ref environments.
export const useRef = <E, A>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRef(initial, { eq, id: Symbol(index) })),
    ),
  )

export const useRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: Omit<RefMap.RefMapOptions<K, V>, 'id'> = {},
): E.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefMap(initial, { ...options, id: Symbol(index) })),
    ),
  )

export const useRefMapM = <E, K, V>(
  initial: E.Env<E, Map<K, V>>,
  options: Omit<RefMapM.RefMapMOptions<K, V>, 'id'> = {},
): E.Env<Ref.Refs, RefMapM.Wrapped<E, K, V>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefMapM(initial, { ...options, id: Symbol(index) })),
    ),
  )

export const useRefArray = <E, A>(
  initial: E.Env<E, ReadonlyArray<A>>,
  options: RefArray.RefArrayOptions<A>,
): E.Env<Ref.Refs, RefArray.Wrapped<E, A>> =>
  pipe(
    getHookIndex,
    E.chainW((index) =>
      HookRefs.getOrCreate(index, createHookRefArray(initial, { ...options, id: Symbol(index) })),
    ),
  )

// Creates a Reference which is scoped explicity to the environment in which it was created in.
const createHookRef = <E, A>(
  initial: E.Env<E, A>,
  options: Ref.RefOptions<A>,
): E.Env<Ref.Refs, Ref.Wrapped<E, A>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(Ref.create(initial, options), Ref.useSome(refs))),
  )

const createHookRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: RefMap.RefMapOptions<K, V>,
): E.Env<Ref.Refs, RefMap.Wrapped<E, K, V>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefMap.create(initial, options), RefMap.useSome(refs))),
  )

const createHookRefMapM = <E, K, V>(
  initial: E.Env<E, Map<K, V>>,
  options: RefMapM.RefMapMOptions<K, V>,
): E.Env<Ref.Refs, RefMapM.Wrapped<E, K, V>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefMapM.create(initial, options), RefMapM.useSome(refs))),
  )

const createHookRefArray = <E, A>(
  initial: E.Env<E, ReadonlyArray<A>>,
  options: RefArray.RefArrayOptions<A>,
): E.Env<Ref.Refs, RefArray.Wrapped<E, A>> =>
  pipe(
    Ref.getRefs,
    E.map((refs) => pipe(RefArray.create(initial, options), RefArray.useSome(refs))),
  )

export const withHooks =
  <A>(Eq: Eq<A> = deepEqualsEq) =>
  <E1, B>(f: (value: A) => Ref.Env<E1, B>) =>
  <E2>(rs: RS.ReaderStream<E2, A>): RS.ReaderStream<E1 & E2 & Ref.Refs, B> =>
    pipe(
      RefDisposable.get,
      RS.fromEnv,
      RS.switchMapW((refDisposable) =>
        pipe(
          rs,
          // Allows skipping "props" updates
          RS.skipRepeatsWith(Eq),
          // Ensure we sample when internal state has been updated
          RS.chainFirstW(() =>
            pipe(Ref.getRefEvents, RS.filter(not(Ref.isCreated)), RS.startWith(null)),
          ),
          RS.exhaustMapLatestEnv((a) =>
            pipe(
              // Reset Hook Index on each invocation
              resetIndex,
              E.chainW(() => f(a)),
            ),
          ),
          // Cleanup when we're all finished
          RS.onDispose(refDisposable),
        ),
      ),
    )

export const withHooksArray =
  <A>(Eq: Eq<A> = deepEqualsEq) =>
  <E1, B>(f: (value: A) => Ref.Env<E1, B>) =>
  <E2>(rs: RS.ReaderStream<E2, readonly A[]>): RS.ReaderStream<E1 & E2 & Ref.Refs, readonly B[]> =>
  (e) =>
    new WithHooksArray(Eq, f, rs, e)

class WithHooksArray<E1, E2, A, B> implements S.Stream<readonly B[]> {
  constructor(
    readonly Eq: Eq<A>,
    readonly f: (value: A) => Ref.Env<E1, B>,
    readonly rs: RS.ReaderStream<E2, readonly A[]>,
    readonly r: E1 & E2 & Ref.Refs,
  ) {}

  run(sink: S.Sink<readonly B[]>, scheduler: S.Scheduler): S.Disposable {
    const s = new WithHooksArraySink(this, sink, scheduler)

    return disposeBoth(s, this.rs(this.r).run(s, scheduler))
  }
}

class WithHooksArraySink<E1, E2, A, B> implements S.Sink<readonly A[]>, S.Disposable {
  readonly disposables = new Map<A, S.Disposable>()
  readonly references = new Map<A, Ref.Refs>()
  readonly values = new Map<A, B>()

  readonly findDifference: (second: readonly A[]) => (first: readonly A[]) => readonly A[]
  readonly findDisposable: (k: A) => O.Option<S.Disposable>
  readonly findRefs: (k: A) => O.Option<Ref.Refs>

  protected current: ReadonlyArray<A> = []
  protected disposable: S.Disposable = disposeNone()
  protected finished = false
  protected referenceCount = 0
  protected parentRefs: Ref.Refs

  constructor(
    readonly host: WithHooksArray<E1, E2, A, B>,
    readonly sink: S.Sink<readonly B[]>,
    readonly scheduler: S.Scheduler,
  ) {
    this.findDisposable = (k: A) => lookup(host.Eq)(k)(this.disposables)
    this.findRefs = (k: A) => lookup(host.Eq)(k)(this.references)
    this.findDifference = RA.difference(host.Eq)
    this.parentRefs = {
      getRef: host.r.getRef,
      hasRef: host.r.hasRef,
      setRef: host.r.setRef,
      removeRef: host.r.removeRef,
      refEvents: host.r.refEvents,
      parentRefs: host.r.parentRefs,
    }
  }

  event = (t: S.Time, values: readonly A[]) => {
    const removed = pipe(this.current, this.findDifference(values))
    const added = pipe(values, this.findDifference(this.current))

    this.current = values

    // Clean up all the removed keys
    pipe(removed, RA.map(this.findDisposable), RA.compact, disposeAll).dispose()
    removed.forEach((r) => {
      this.values.delete(r)
      this.references.delete(r)
    })

    // Subscribe to all the newly added values
    added.forEach((a) => this.disposables.set(a, this.runInner(t, a)))

    this.disposable = this.emitIfReady()
  }

  error = (t: S.Time, error: Error) => {
    this.dispose()
    this.sink.error(t, error)
  }

  end = (t: S.Time) => {
    this.finished = true
    this.endIfReady(t)
  }

  dispose = () => {
    this.finished = true
    this.disposables.forEach((d) => d.dispose())
    this.disposables.clear()
    this.values.clear()
    this.current = []
  }

  runInner = (t: S.Time, a: A): S.Disposable => {
    const refs = this.getRefs(a)

    return pipe(refs.refEvents[1], S.filter(not(Ref.isCreated))).run(
      this.innerSink(),
      schedulerRelativeTo(t, this.scheduler),
    )
  }

  innerSink = (): S.Sink<unknown> => {
    this.referenceCount++

    return {
      event: () => {
        this.disposable.dispose()
        this.disposable = this.emitIfReady()
      },
      error: (t, e) => this.error(t, e),
      end: (t) => {
        this.referenceCount--
        this.endIfReady(t)
      },
    }
  }

  getRefs = (k: A) =>
    pipe(
      k,
      this.findRefs,
      O.getOrElseW(() => {
        const r = Ref.refs({ parentRefs: this.parentRefs })

        this.references.set(k, r)

        return r
      }),
    )

  // TODO: How to make this more effecient??
  // Can we keep a map of current values and only sample those that do not currently have values?
  emitIfReady = () => {
    const env = pipe(
      this.current,
      RA.map((a) => pipe(a, this.host.f, E.useSome(this.getRefs(a)))),
      E.zipW,
      E.chainW((values) => E.fromIO(() => this.sink.event(this.scheduler.currentTime(), values))),
    )

    return asap(
      S.createCallbackTask(() => exec(env(this.host.r))),
      this.scheduler,
    )
  }

  endIfReady = (t: S.Time) => {
    if (this.finished && this.referenceCount === 0) {
      this.sink.end(t)
      this.dispose()
    }
  }
}

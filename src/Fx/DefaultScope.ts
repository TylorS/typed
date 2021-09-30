/* eslint-disable @typescript-eslint/no-this-alias */
import { constVoid } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/lib/Option'

import { Cancelable, cancelAll } from '@/Cancelable'
import { Settable } from '@/Cancelable/settable'
import { FiberRef } from '@/FiberRef/FiberRef'

import { fromIO } from './Computations'
import { Fx } from './Fx'
import { FiberLocalState, Scope } from './Scope'

export class DefaultScope implements Scope {
  public references: FiberLocalState<any, any>
  #resources: Settable = new Settable()

  constructor(options: ScopeOptions = {}) {
    this.references = options.references ?? new Map()
  }

  readonly cloneReferences = (): FiberLocalState<any, any> =>
    new Map(forkReferences(this.references))

  readonly inheritRefs = (toInherit: FiberLocalState<any, any>): void => {
    if (toInherit.size === 0) {
      return constVoid()
    }

    toInherit.forEach((incoming, key) => {
      if (this.references.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const local = this.references.get(key)!

        this.references.set(key, mergeFiberRefState(local, incoming))
      } else {
        this.references.set(key, incoming)
      }
    })
  }

  readonly trackResources = (...cancelables: readonly Cancelable[]): Cancelable =>
    cancelAll(...cancelables.map((c) => this.#resources.add(c)))

  readonly cancel = (): void | Promise<void> => this.#resources.cancel()

  readonly isClosed = (): boolean => this.#resources.isCanceled()

  readonly getFiberRef = <A>(ref: FiberRef<A>): Fx<unknown, A> => {
    const { id } = ref
    const self = this

    return fromIO(() => {
      if (self.references.has(id)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return self.references.get(id)!.value
      }

      self.references.set(id, initialState(ref))

      return ref.initial
    })
  }

  readonly updateFiberRef = <A, R>(ref: FiberRef<A>, f: (value: A) => Fx<R, A>): Fx<R, A> => {
    const self = this

    return Fx(function* () {
      const current = yield* self.getFiberRef(ref)
      const updated = yield* f(current)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentState = self.references.get(ref.id)!

      self.references.set(ref.id, {
        ...currentState,
        value: currentState.join(current, updated),
      })

      return updated
    })
  }

  readonly deleteFiberRef = <A>(ref: FiberRef<A>): Fx<unknown, Option<A>> => {
    const { id } = ref
    const self = this

    return fromIO(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const current = self.references.has(id) ? some(self.references.get(id)!.value) : none

      self.references.delete(id)

      return current
    })
  }
}

export interface FiberRefState<A> {
  readonly value: A
  readonly fork: (a: A) => A
  readonly join: (left: A, right: A) => A
}

export interface ScopeOptions {
  readonly references?: Map<any, any>
}

function mergeFiberRefState<A>(
  local: FiberRefState<A>,
  incoming: FiberRefState<A>,
): FiberRefState<A> {
  return {
    value: local.join(local.value, incoming.value),
    join: local.join,
    fork: local.fork,
  }
}

function* forkReferences<K, V>(
  local: FiberLocalState<K, V>,
): Generator<readonly [K, V], void, unknown> {
  for (const [k, { value, fork }] of local) {
    yield [k, fork(value)] as const
  }
}

function initialState<A>(ref: FiberRef<A>): FiberRefState<A> {
  return {
    value: ref.initial,
    fork: ref.fork,
    join: ref.join,
  }
}

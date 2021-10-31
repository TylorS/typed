import { pipe } from 'fp-ts/function'
import { fromNullable, isSome, none, Option, some } from 'fp-ts/Option'

import { defaultRenderer, Renderer } from '@/Cause'
import { fromIO, getContext } from '@/Fiber/Instruction'
import type { FiberLocal } from '@/FiberLocal'
import { Fx } from '@/Fx'
import * as MutableRef from '@/MutableRef'
import type { Scheduler } from '@/Scheduler'
import * as Subject from '@/Subject'

import { Context, ContextLocals, FiberLocalEvent } from './Context'

export interface ContextOptions {
  readonly scheduler: Scheduler
  readonly renderer?: Renderer
  readonly parent?: Context
  readonly locals?: Map<FiberLocal<any, any>, any>
}

export function make(options: ContextOptions): Context {
  return {
    scheduler: options.scheduler,
    locals: makeLocals(options.locals),
    renderer: defaultRenderer,
    parent: MutableRef.make(fromNullable(options.parent)),
  }
}

export function makeLocals(locals: Map<FiberLocal<any, any>, any> = new Map()): ContextLocals {
  const [sink, events] = Subject.make<FiberLocalEvent<any, any>>()

  function get<R, A>(fiberLocal: FiberLocal<R, A>): Fx<R, A> {
    return Fx(function* () {
      if (locals.has(fiberLocal)) {
        return locals.get(fiberLocal) as A
      }

      const a = yield* fiberLocal.initial

      locals.set(fiberLocal, a)

      yield* sink.event({ type: 'FiberLocal/Created', fiberLocal, value: a })

      return a
    })
  }

  function set<R, A>(fiberLocal: FiberLocal<R, A>, value: A): Fx<R, A> {
    return Fx(function* () {
      const previous = yield* get(fiberLocal)
      const areEqual = pipe(value, fiberLocal.equals(previous))

      locals.set(fiberLocal, value)

      if (!areEqual) {
        yield* sink.event({ type: 'FiberLocal/Updated', fiberLocal, previous, value })
      }

      return value
    })
  }

  function del<R, A>(fiberLocal: FiberLocal<R, A>): Fx<unknown, Option<A>> {
    return fromIO(() => {
      const option = locals.has(fiberLocal) ? some(locals.get(fiberLocal) as A) : none

      locals.delete(fiberLocal)

      return option
    })
  }

  const inherit = Fx(function* () {
    const context = yield* getContext

    for (const [local, value] of locals) {
      const current = yield* context.locals.get(local)

      yield* context.locals.set(local, local.concat(value)(current))
    }
  })

  function fork(): ContextLocals {
    const newLocals: typeof locals = new Map()

    for (const [local, value] of locals) {
      const option = local.fork(value)

      if (isSome(option)) {
        newLocals.set(local, option.value)
      }
    }

    return makeLocals(newLocals)
  }

  return {
    events,
    get,
    set,
    delete: del,
    inherit,
    fork,
  }
}

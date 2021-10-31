import { none, Option, some } from 'fp-ts/Option'

import { fromIO, fromValue } from '@/Fiber/Instruction'
import { Fx, Of } from '@/Fx'
import { Stream } from '@/Stream'
import * as Subject from '@/Subject'

import { Dep, Provider } from './Dep'
import { DepEvent } from './DepEvent'

export interface DepManager {
  readonly events: DepEvents
  readonly get: <R, A>(provider: Provider<R, A>) => Fx<R, A>
  readonly set: <A>(dep: Dep<A>, service: A) => Of<A>
  readonly delete: <A>(dep: Dep<A>) => Of<Option<A>>
}

export interface DepEvents extends Stream<unknown, DepEvent<any>> {}

export function makeDepManager(): DepManager {
  const [sink, events] = Subject.make<DepEvent<any>>()
  const dependencies = new Map<Dep<any>, any>()

  function get<R, A>(provider: Provider<R, A>): Fx<R, A> {
    return Fx(function* () {
      if (dependencies.has(provider.id)) {
        return dependencies.get(provider.id) as A
      }

      const service = yield* provider.provider

      dependencies.set(provider.id, service)

      yield* sink.event({ type: 'Dep/Created', dep: provider.id, service })

      return service
    })
  }

  function set<A>(dep: Dep<A>, service: A): Of<A> {
    return Fx(function* () {
      const previous = yield* get({ id: dep, provider: fromValue(service) })

      dependencies.set(dep, service)

      if (service !== previous) {
        yield* sink.event({
          type: 'Dep/Updated',
          dep,
          previous,
          service,
        })
      }

      return service
    })
  }

  function del<A>(dep: Dep<A>): Fx<unknown, Option<A>> {
    return fromIO(() => {
      const option = dependencies.has(dep) ? some(dependencies.get(dep) as A) : none

      dependencies.delete(dep)

      return option
    })
  }

  return {
    events,
    get,
    set,
    delete: del,
  }
}

import { SchedulerEnv } from '@fp/Scheduler'
import { createSink } from '@fp/Stream'
import { Sink, Stream } from '@most/types'

import * as E from '../Env'
import { useDisposable } from './useDisposable'

export const useStream = <A>(stream: Stream<A>, sink: Partial<Sink<A>> = {}) =>
  E.asksE((e: SchedulerEnv) =>
    useDisposable(() => stream.run(createSink(sink), e.scheduler), [stream]),
  )

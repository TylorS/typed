import { none, some } from 'fp-ts/Option'
import { describe } from 'mocha'

import { makeFiberId } from '@/FiberId'
import * as Scheduler from '@/Scheduler'
import { EventElement } from '@/Sink'
import { prettyTrace, Trace, traceLocation } from '@/Trace'

import { Tracer } from './Tracer'

describe(__filename, () => {
  describe(Tracer.name, () => {
    const tracer = new Tracer<unknown>()

    describe('events', () => {
      it('can capture a trace for a chain of events', () => {
        const scheduler = Scheduler.make()
        const time = scheduler.getCurrentTime()
        const fiberId = makeFiberId(0)

        const askEvent: EventElement<{ expected: number }> = {
          type: 'Event',
          time,
          operator: 'ask',
          value: { expected: 42 },
          trace: none,
          fiberId,
        }

        const askTrace = tracer.event(askEvent)
        const chainTrace = new Trace(fiberId, [traceLocation('chain')], some(askTrace))

        const event: EventElement<number> = {
          type: 'Event',
          time,
          operator: 'of',
          value: 42,
          trace: some(chainTrace),
          fiberId,
        }
        const trace = tracer.event(event)

        console.log(prettyTrace(trace))
      })
    })
  })
})

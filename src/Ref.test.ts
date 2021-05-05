import { ArgsOf, pipe } from '@fp/function'
import { createSink } from '@fp/Stream'
import { Assertions, describe, it } from '@typed/test'
import { createVirtualScheduler } from 'most-virtual-scheduler'

import * as E from './Env'
import { alwaysEqualsEq } from './Eq'
import { Do } from './Fx/Env'
import { LiftFx2 } from './FxT'
import { createRef, createReferences, deleteRef, getRef, RefEvent, Refs, setRef } from './Ref'
import { exec } from './Resume'

const initial = 1
const ref = createRef(E.of(initial))

export const test = describe(`Ref`, [
  itRef('retrieves values that did not previously exist', function* (_, { equal }) {
    equal(initial, yield* _(getRef(ref)))
  }),

  itRefEvent(
    'sends RefCreated event on Ref creation',
    function* (_) {
      yield* _(getRef(ref))
    },
    [
      {
        type: 'created',
        id: ref.id,
        value: initial,
      },
    ],
  ),

  itRef(
    'retrieves values that did previously exist',
    function* (_, { equal }) {
      equal(2, yield* _(getRef(ref)))
    },

    [[ref.id, 2]],
  ),

  itRef('updates references', function* (_, { equal }) {
    equal(initial, yield* _(getRef(ref)))

    const expected = 2

    equal(expected, yield* _(setRef(ref)(expected)))
    equal(expected, yield* _(getRef(ref)))
  }),

  itRefEvent(
    'sends RefUpdated event when updated',
    function* (_) {
      yield* _(setRef(ref)(2))
    },
    [
      {
        type: 'created',
        id: ref.id,
        value: initial,
      },
      {
        type: 'updated',
        id: ref.id,
        previousValue: initial,
        value: 2,
      },
    ],
  ),

  itRefEvent(
    'uses provided Eq instance to skip RefUpdated event',
    function* (_) {
      yield* _(setRef({ ...ref, eq: alwaysEqualsEq })(2))
    },
    [
      {
        type: 'created',
        id: ref.id,
        value: initial,
      },
    ],
  ),

  itRef(
    'deletes references',
    function* (_, { equal }) {
      yield* _(deleteRef(ref))

      equal(initial, yield* _(getRef(ref)))
    },
    [[ref.id, 2]],
  ),

  itRefEvent(
    'sends RefDeleted event when references are deleted',
    function* (_) {
      yield* _(deleteRef(ref))
    },
    [{ type: 'deleted', id: ref.id }],
    [[ref.id, 2]],
  ),
])

function itRef(
  does: string,
  f: (lift: LiftFx2<E.URI>, assertions: Assertions) => Generator<E.Env<Refs, any>>,
  ...rest: ArgsOf<typeof createReferences>
) {
  return it(does, (assertions, done) => {
    const test = Do(function* (lift) {
      try {
        yield* f(lift, assertions)

        done()
      } catch (e) {
        done(e)
      }
    })

    pipe(
      {
        refs: createReferences(...rest),
      },
      test,
      exec,
    )
  })
}

function itRefEvent(
  does: string,
  f: (lift: LiftFx2<E.URI>) => Generator<E.Env<Refs, any>>,
  events: ReadonlyArray<RefEvent<unknown>>,
  ...rest: ArgsOf<typeof createReferences>
) {
  return it(does, ({ equal }, done) => {
    const [timer, scheduler] = createVirtualScheduler()
    const refs = createReferences(...rest)
    const test = Do(function* (lift) {
      try {
        yield* f(lift)

        done()
      } catch (e) {
        done(e)
      }
    })

    const expectedEvents = events.slice()

    refs.events.run(
      createSink({
        event: (_, event) => {
          try {
            const expected = expectedEvents.shift()

            if (!expected) {
              throw new Error(`Unexpected event ${JSON.stringify(event)}`)
            }

            equal(expected, event)

            if (expectedEvents.length === 0) {
              return done()
            }
          } catch (e) {
            done(e)
          }
        },
      }),
      scheduler,
    )

    pipe(
      {
        refs,
      },
      test,
      exec,
    )

    timer.progressTimeBy(1)
  })
}

import * as E from '@fp/Env'
import * as H from '@fp/hooks'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import * as U from '@fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { range } from 'fp-ts/ReadonlyNonEmptyArray'
import { html, render, Renderable } from 'uhtml'

/**
 * This is an example of using hooks to render a dynamically-sized
 * set of Counters with their own internal state separate from any other Counters.
 */

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count: Ref.Wrapped<unknown, number> = Ref.create(E.of(0))

// Actions to update our Count Reference - easily tested
const increment: E.Env<Ref.Refs, number> = Count.update(F.flow(F.increment, E.of))
const decrement: E.Env<Ref.Refs, number> = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter = (label: string): E.Env<Ref.Refs, Renderable> =>
  F.pipe(
    E.Do,
    E.bindW('inc', () => U.useOp(() => increment)),
    E.bindW('dec', () => U.useOp(() => decrement)),
    E.bindW('count', () => Count.get),
    E.map(
      ({ inc, dec, count }) => html`<div>
        <button onclick=${dec}>Decrement</button>
        <span>${label}: ${count}</span>
        <button onclick=${inc}>Increment</button>
      </div>`,
    ),
  )

// Creates a Counter to keep track of the total number of Counters
const Header: RS.ReaderStream<Ref.Refs, Renderable> = F.pipe(
  `Number Of Counters`,
  Counter,
  H.withHooks,
)

// Create a list of Counters with their own isolated Ref.Refs for state management
// based on the current count
const Counters: RS.ReaderStream<Ref.Refs, ReadonlyArray<Renderable>> = F.pipe(
  Count.get,
  E.map((count) => (count === 0 ? [] : range(1, count))),
  H.withHooks,
  H.mergeMapWithHooks(N.Eq)(F.flow(String, Counter)),
)

// Combines Counters with a Header that is also just a Counter and renders on each update
const Main: RS.ReaderStream<Ref.Refs, HTMLElement> = F.pipe(
  RS.combineAll(Header, Counters),
  RS.map(([header, counters]) => html`<div>${header} ${counters}</div>`),
  RS.scan(render, rootElement),
)

// Provide Main with its required resources
const stream: S.Stream<HTMLElement> = Main(Ref.refs())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))

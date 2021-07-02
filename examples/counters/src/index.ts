import * as E from '@fp/Env'
import * as H from '@fp/hooks'
import * as N from '@fp/number'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { runEffects } from '@fp/Stream'
import * as U from '@fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { html, render } from 'uhtml'

/**
 * This is an example of using hooks to create a homogenous list of
 * isolated Ref.Refs environments
 */

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
const Count = Ref.create(E.of(0))

// Actions to update our Count Reference
const increment = Count.update(F.flow(F.increment, E.of))
const decrement = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Use Hooks to interface our Ref with our UI
const useCounter = F.pipe(
  E.Do,
  E.bindW('inc', () => U.useOp(() => increment)),
  E.bindW('dec', () => U.useOp(() => decrement)),
  E.bindW('count', () => Count.get),
)

// Creates a component which represent our counter
const Counter = (label: string) =>
  F.pipe(
    useCounter,
    E.map(
      ({ inc, dec, count }) => html`<div>
        <button onclick=${dec}>Decrement</button>
        <span>${label}: ${count}</span>
        <button onclick=${inc}>Increment</button>
      </div>`,
    ),
  )

// Create a list of Counters with their own isolated Ref.Refs for state management
const Counters = F.pipe(
  Count.get,
  // Create a new array each time our Count updates
  E.map((count) => Array.from({ length: count }, (_, i) => i + 1)),
  // Creates a Stream of Arrays that emits whenever the Count is updated
  H.withHooks,
  // Maps over our Array to unique instances of Counter
  H.mergeMapWithHooks(N.Eq)(F.flow(String, Counter)),
)

// Combines Counters with a Header that is also just a Counter and renders on each update
const Main = F.pipe(
  RS.Do,
  RS.bindW('header', () => F.pipe(`Number Of Counters`, Counter, H.withHooks)),
  RS.bindW('counters', () => Counters),
  RS.map(({ header, counters }) => html`<div>${header} ${counters}</div>`),
  RS.scan(render, rootElement),
)

// Provide Main with its required resources
const stream = Main(Ref.refs())

runEffects(stream, newDefaultScheduler()).catch((error) => {
  console.error(error)
})

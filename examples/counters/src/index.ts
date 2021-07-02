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

// Actions to update our Count Reference - easily tested
const increment = Count.update(F.flow(F.increment, E.of))
const decrement = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter = (label: string) =>
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
const Header = F.pipe(`Number Of Counters`, Counter, H.withHooks)

// Create a list of Counters with their own isolated Ref.Refs for state management
// based on the current count
const Counters = F.pipe(
  Count.get,
  E.map((count) => range(0, count)),
  H.withHooks,
  H.mergeMapWithHooks(N.Eq)(F.flow(String, Counter)),
)

// Combines Counters with a Header that is also just a Counter and renders on each update
const Main = F.pipe(
  RS.combineAll(Header, Counters),
  RS.map(([header, counters]) => html`<div>${header} ${counters}</div>`),
  RS.scan(render, rootElement),
)

// Provide Main with its required resources
const stream = Main(Ref.refs())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))

import * as E from '@fp/Env'
import * as KV from '@fp/KV'
import * as O from '@fp/Option'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import * as U from '@fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import * as N from 'fp-ts/number'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { html, render, Renderable } from 'uhtml'

/**
 * This is an example of using Ref to render a dynamically-sized
 * set of Counters with their own internal state separate from any other Counters.
 */

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count = Ref.kv(E.of(0))

// Actions to update our Count Reference - easily tested
const increment: E.Env<KV.Env, number> = Count.update(F.flow(F.increment, E.of))
const decrement: E.Env<KV.Env, number> = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter = (label: string): E.Env<KV.Env, Renderable> =>
  F.pipe(
    E.Do,
    U.bindEnvK('dec', () => decrement),
    U.bindEnvK('inc', () => increment),
    E.bindW('count', () => Count.get),
    E.map(
      ({ dec, inc, count }) => html`<div>
        <button onclick=${dec}>Decrement</button>
        <span>${label}: ${count}</span>
        <button onclick=${inc}>Increment</button>
      </div>`,
    ),
  )

// Creates a Counter to keep track of the total number of Counters
const Header: RS.ReaderStream<KV.Env, Renderable> = F.pipe(`Number Of Counters`, Counter, KV.sample)

// Create a list of Counters with their own isolated KV.Env for state management
// based on the current count
const Counters: RS.ReaderStream<KV.Env, readonly Renderable[]> = F.pipe(
  Count.values,
  RS.map(
    O.match(
      (): ReadonlyArray<number> => [],
      (count) => (count === 0 ? [] : RNEA.range(1, count)),
    ),
  ),
  U.useKVs(F.flow(String, Counter), N.Eq),
)

// Combines Counters with a Header that is also just a Counter and renders on each update
const Main: RS.ReaderStream<KV.Env, HTMLElement> = F.pipe(
  RS.combineAll(Header, Counters),
  RS.map(([header, counters]) => html`${header} ${counters}`),
  RS.scan(render, rootElement),
)

// Provide Main with its required resources
const stream: S.Stream<HTMLElement> = Main(KV.env())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))

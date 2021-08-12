import * as E from '@fp/Env'
import * as KV from '@fp/KV'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as S from '@fp/Stream'
import * as U from '@fp/use'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { html, render, Renderable } from 'uhtml'

/**
 * This is an example of using Ref to model a Counter over time.
 */

const rootElement: HTMLElement | null = document.getElementById('app')

if (!rootElement) {
  throw new Error('Unable to find element by #app')
}

// Creates a Reference to keep our Count
// It requires no resources and tracks a number
const Count = Ref.kv(E.of(0))

// Actions to update our Count Reference - easily tested
const increment: E.Env<KV.Env<symbol>, number> = Count.update(F.flow(F.increment, E.of))

const decrement: E.Env<KV.Env<symbol>, number> = Count.update(
  F.flow(
    F.decrement,
    E.of,
    E.map((x) => Math.max(0, x)),
  ),
)

// Creates a component which represents our counter
const Counter: E.Env<KV.Env<symbol>, Renderable> = F.pipe(
  E.Do,
  U.bindEnvK('dec', () => decrement),
  U.bindEnvK('inc', () => increment),
  E.bindW('count', () => Count.get),
  E.map(
    ({ dec, inc, count }) => html`<div>
      <button onclick=${dec}>Decrement</button>
      <span>Count: ${count}</span>
      <button onclick=${inc}>Increment</button>
    </div>`,
  ),
)

// Sample our Counter everytime there is a Ref update.
const Main: RS.ReaderStream<KV.Env<symbol>, HTMLElement> = F.pipe(
  Counter,
  KV.sample,
  RS.scan(render, rootElement),
)

// Provide Main with its required resources
const stream: S.Stream<HTMLElement> = Main(KV.env())

// Execute our Stream with a default scheduler
S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))

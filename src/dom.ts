/**
 * @typed/fp/dom is a collection of abstractions for working with the DOM
 * @since 0.13.2
 */
import { A } from 'ts-toolbelt'
import { ParseSelector } from 'typed-query-selector/parser'

import * as E from './Env'
import * as EO from './EnvOption'
import * as Fail from './Fail'
import { ArgsOf, pipe } from './function'
import * as KV from './KV'
import * as O from './Option'
import * as RS from './ReaderStream'
import { Resume } from './Resume'
import { SchedulerEnv } from './Scheduler'
import * as S from './Stream'
import { useReaderStream } from './Use'

/**
 * @category Environment
 * @since 0.13.2
 */
export type HistoryEnv = { readonly history: History }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getHistory = E.asks((e: HistoryEnv) => e.history)

/**
 * @category Environment
 * @since 0.13.2
 */
export type LocationEnv = { readonly location: Location }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getLocation = E.asks((e: LocationEnv) => e.location)

/**
 * @category Environment
 * @since 0.13.2
 */
export type RafEnv = {
  readonly raf: Resume<number>
}

/**
 * @category Effect
 * @since 0.13.2
 */
export const raf: E.Env<RafEnv, number> = (e: RafEnv) => e.raf

/**
 * @category Environment
 * @since 0.13.2
 */
export type WhenIdleEnv = {
  readonly whenIdle: Resume<IdleDeadline>
}

/**
 * @category Effect
 * @since 0.13.2
 */
export const whenIdle: E.Env<WhenIdleEnv, IdleDeadline> = (e: WhenIdleEnv) => e.whenIdle

/**
 * @category Environment
 * @since 0.13.2
 */
export type WindowEnv = { readonly window: Window }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getWindow = E.asks((e: WindowEnv) => e.window)

/**
 * @category Environment
 * @since 0.13.2
 */
export type DocumentEnv = { readonly document: Document }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getDocument = E.asks((e: DocumentEnv) => e.document)

/**
 * @category Environment
 * @since 0.13.2
 */
export type RootElementEnv = { readonly rootElement: Element }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getRootElement = E.asks((e: RootElementEnv) => e.rootElement)

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelector =
  <S extends string>(selector: S) =>
  <N extends ParentNode>(el: N) =>
    O.fromNullable(el.querySelector<ParseSelector<S, A.Cast<N, Element>>>(selector))

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelectorAll =
  <S extends string>(selector: S) =>
  <N extends ParentNode>(el: N) =>
    Array.from(el.querySelectorAll(selector)) as readonly ParseSelector<S, Element>[]

/**
 * A Failure used to represent being unable to query for our RootElement
 * @category Failure
 * @since 0.13.4
 */
export const QueryRootElementFailure = Fail.named<{
  readonly selector: string
  readonly message: string
}>()('@typed/fp/dom/QueryRootElementError')

/**
 * A Failure used to represent being unable to query for our RootElement
 * @category Environment
 * @since 0.13.4
 */
export type QueryRootElementFailure = Fail.EnvOf<typeof QueryRootElementFailure>

/**
 * Provide the root element to your application by querying for an element in the document
 * @category DOM
 * @since 0.13.2
 */
export const queryRootElement = (selector: string) =>
  pipe(
    getDocument,
    E.map(querySelector(selector)),
    EO.map((rootElement): RootElementEnv => ({ rootElement })),
    EO.getOrElseEW(() =>
      QueryRootElementFailure.throw({
        selector,
        message: `Unable to find root element by selector ${selector}!`,
      }),
    ),
  )

/**
 * Common setup for rendering an application into an element
 * @category DOM
 * @since 0.13.4
 */
export const patch =
  <Patch extends (element: any, renderable: any) => any>(patch: Patch) =>
  <E>(
    stream: RS.ReaderStream<E, ArgsOf<Patch>[1]>,
  ): RS.ReaderStream<E & KV.Env & RootElementEnv & QueryRootElementFailure, ArgsOf<Patch>[0]> =>
    pipe(
      getRootElement,
      RS.fromEnv,
      RS.switchMapW((rootElement) => pipe(stream, RS.scan(patch, rootElement))),
    )

/**
 * Find the default EventMap for a given element
 * @category Type-level
 * @since 0.13.4
 */
export type GetDefaultEventMap<Target> = Target extends Window
  ? WindowEventMap
  : Target extends Document
  ? DocumentEventMap
  : Target extends HTMLBodyElement
  ? HTMLBodyElementEventMap
  : Target extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : Target extends HTMLMediaElement
  ? HTMLMediaElementEventMap
  : Target extends HTMLFrameSetElement
  ? HTMLFrameSetElementEventMap
  : Target extends HTMLElement
  ? HTMLElementEventMap
  : Target extends SVGElement
  ? SVGElementEventMap
  : Target extends Element
  ? ElementEventMap
  : Readonly<Record<string, unknown>>

/**
 * Append the proper CurrentTarget to an Event
 * @category Type-level
 * @since 0.13.4
 */
export type WithCurrentTarget<Ev, Target> = Ev & { readonly currentTarget: Target }

/**
 * @category Use
 * @since 0.13.4
 */
export const useEventListener = <E1, Target extends EventTarget, EventName extends string, E2, A>(
  getEventListener: E.Env<E1, O.Option<Target>>,
  eventName: EventName,
  onEvent: (
    event: WithCurrentTarget<GetDefaultEventMap<Target>[EventName], Target>,
  ) => E.Env<E2, A>,
): E.Env<E1 & E2 & KV.Env & SchedulerEnv, O.Option<A>> => {
  type Ev = WithCurrentTarget<GetDefaultEventMap<Target>[EventName], Target>
  const use = useReaderStream<Target>()

  return pipe(
    getEventListener,
    EO.chainEnvK((target) =>
      use(
        (r: E2) =>
          pipe(
            S.newStream<Resume<A>>((sink, scheduler) => {
              const listener = (ev: unknown) =>
                sink.event(scheduler.currentTime(), pipe(r, onEvent(ev as Ev)))

              target.addEventListener(eventName, listener)

              return { dispose: () => target.removeEventListener(eventName, listener) }
            }),
            S.mergeMapConcurrently(S.fromResume, 1),
          ),
        target,
      ),
    ),
    E.map(O.flatten),
  )
}

/**
 * @category Use
 * @since 0.15.0
 */
export const usePopstate = pipe(
  useEventListener(pipe(getWindow, EO.fromEnv), 'popstate', () => getState),
  EO.getOrElseEW(() => getState),
)

/**
 * @category Use
 * @since 0.15.0
 */
export const useHashChange = pipe(
  useEventListener(pipe(getWindow, EO.fromEnv), 'hashchange', () => getHash),
  EO.getOrElseEW(() => getHash),
)

/**
 * @category Use
 * @since 0.15.0
 */
export const useLocation = pipe(getLocation, E.apFirstW(usePopstate), E.apFirstW(useHashChange))

/**
 * @category History
 * @since 0.13.2
 */
export const pushState = <A>(state: A, path: string) =>
  pipe(
    getHistory,
    E.chainW((history) => E.fromIO(() => history.pushState(state, '', path))),
  )

/**
 * @category History
 * @since 0.13.2
 */
export const navigateTo = (path: string) => pushState(null, path)

/**
 * @category History
 * @since 0.13.2
 */
export const replaceState = <A>(state: A, path: string) =>
  pipe(
    getHistory,
    E.chainW((history) => E.fromIO(() => history.replaceState(state, '', path))),
  )

/**
 * @category History
 * @since 0.13.2
 */
export const getState = pipe(
  getHistory,
  E.map(({ state }) => state as unknown),
)

/**
 * @category History
 * @since 0.13.3
 */
export const goBack = pipe(
  getHistory,
  E.chainW((history) => E.fromIO(() => history.back())),
)

/**
 * @category History
 * @since 0.13.3
 */
export const goForward = pipe(
  getHistory,
  E.chainW((history) => E.fromIO(() => history.forward())),
)

/**
 * @category History
 * @since 0.13.3
 */
export const goTo = (n: number) =>
  pipe(
    getHistory,
    E.chainW((history) => E.fromIO(() => history.go(n))),
  )

/**
 * @category Location
 * @since 0.13.2
 */
export const reload = pipe(
  getLocation,
  E.chainW((l) => E.fromIO(() => l.reload())),
)

/**
 * @category Location
 * @since 0.13.2
 */
export const assign = (url: string | URL) =>
  pipe(
    getLocation,
    E.chainW((l) => E.fromIO(() => l.assign(url))),
  )

/**
 * @category Location
 * @since 0.13.3
 */
export const getHash = pipe(
  getLocation,
  E.map((l) => l.hash),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getPathname = pipe(
  getLocation,
  E.map((l) => l.pathname),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getOrigin = pipe(
  getLocation,
  E.map((l) => l.origin),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getHref = pipe(
  getLocation,
  E.map((l) => l.href),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getHost = pipe(
  getLocation,
  E.map((l) => l.host),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getHostname = pipe(
  getLocation,
  E.map((l) => l.hostname),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getPort = pipe(
  getLocation,
  E.map((l) => l.port),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getProtocol = pipe(
  getLocation,
  E.map((l) => l.protocol),
)

/**
 * @category Location
 * @since 0.13.3
 */
export const getSearch = pipe(
  getLocation,
  E.map((l) => l.search),
)

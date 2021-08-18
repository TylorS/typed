/**
 * @typed/fp/dom is a collection of abstractions for working with the DOM
 * @since 0.13.2
 */
import * as tqs from 'typed-query-selector/parser'

import * as E from './Env'
import * as EO from './EnvOption'
import * as Fail from './Fail'
import { flow, pipe } from './function'
import * as KV from './KV'
import * as O from './Option'
import * as RS from './ReaderStream'
import { Resume } from './Resume'
import { SchedulerEnv } from './Scheduler'
import * as S from './Stream'
import { useReaderStream } from './use'

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
export type RootElementEnv<El extends HTMLElement = HTMLElement> = { readonly rootElement: El }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getRootElement = <El extends HTMLElement = HTMLElement>() =>
  E.asks((e: RootElementEnv<El>) => e.rootElement)

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelector = <S extends string>(selector: S) =>
  pipe(
    getRootElement(),
    E.chainW((el) =>
      E.fromIO(() => O.fromNullable(el.querySelector<tqs.ParseSelector<S, Element>>(selector))),
    ),
  )

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelectorAll = <S extends string>(selector: S) =>
  pipe(
    getRootElement(),
    E.chainW((el) =>
      E.fromIO((): readonly tqs.ParseSelector<S, Element>[] =>
        Array.from(el.querySelectorAll<tqs.ParseSelector<S, Element>>(selector)),
      ),
    ),
  )

/**
 * A Failure used to represent being unable to query for our RootElement
 * @category Failure
 * @since 0.13.2
 */
export const QueryRootElementError = Fail.named<{
  readonly selector: string
  readonly message: string
}>()('@typed/fp/dom/QueryRootElementError')

/**
 * Provide the root element to your application by querying for an element in the document
 * @category DOM
 * @since 0.13.2
 */
export const queryRootElement = <S extends string>(selector: S) =>
  pipe(
    getDocument,
    E.map((d) => O.fromNullable(d.querySelector<tqs.ParseSelector<S, HTMLElement>>(selector))),
    EO.map((rootElement): RootElementEnv<tqs.ParseSelector<S, HTMLElement>> => ({ rootElement })),
    EO.getOrElseEW(
      (): E.Env<Fail.EnvOf<typeof QueryRootElementError>, RootElementEnv> =>
        QueryRootElementError.throw({
          selector,
          message: `Unable to find root element by selector ${selector}!`,
        }),
    ),
  )

/**
 * @category Provider
 * @since 0.13.4
 */
export const provideRootElement = flow(queryRootElement, E.provideSomeWith)

/**
 * @category Provider
 * @since 0.13.4
 */
export const useRootElement = flow(queryRootElement, E.useSomeWith)

/**
 * Common setup for rendering an application into an element queried from the DOM
 * utilizing requestAnimationFrame.
 * @category DOM
 * @since 0.13.2
 */
export const patchKV =
  <S extends string, A>(
    selector: S,
    patch: (
      element: tqs.ParseSelector<S, HTMLElement>,
      renderable: A,
    ) => tqs.ParseSelector<S, HTMLElement>,
  ) =>
  <E>(env: E.Env<E, A>) =>
    pipe(
      getRootElement<tqs.ParseSelector<S, HTMLElement>>(),
      RS.fromEnv,
      RS.switchMapW((rootElement) => pipe(env, KV.sample, RS.scan(patch, rootElement))),
      RS.provideSomeWithEnv(queryRootElement<S>(selector)),
    )

/**
 * Common setup for rendering an application into an element queried from the DOM
 * utilizing requestAnimationFrame.
 * @category DOM
 * @since 0.13.2
 */
export const patchKVOnRaf =
  <S extends string, A>(
    selector: S,
    patch: (
      element: tqs.ParseSelector<S, HTMLElement>,
      renderable: A,
    ) => tqs.ParseSelector<S, HTMLElement>,
  ) =>
  <E>(env: E.Env<E, A>) =>
    pipe(
      raf,
      E.chainW(() => env),
      patchKV(selector, patch),
    )
/**
 * Common setup for rendering an application into an element queried from the DOM
 * utilizing requestAnimationFrame.
 * @category DOM
 * @since 0.13.2
 */
export const patchKVWhenIdle =
  <S extends string, A>(
    selector: S,
    patch: (
      element: tqs.ParseSelector<S, HTMLElement>,
      renderable: A,
    ) => tqs.ParseSelector<S, HTMLElement>,
  ) =>
  <E>(env: E.Env<E, A>) =>
    pipe(
      whenIdle,
      E.chainW(() => env),
      patchKV(selector, patch),
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
        pipe(
          S.newStream<Ev>((sink, scheduler) => {
            const listener = (ev: unknown) => sink.event(scheduler.currentTime(), ev as Ev)

            target.addEventListener(eventName, listener)

            return { dispose: () => target.removeEventListener(eventName, listener) }
          }),
          RS.fromStream,
          RS.chainEnvK(onEvent),
        ),
        target,
      ),
    ),
    E.map(O.flatten),
  )
}

/**
 * @category Use
 * @since 0.13.2
 */
export const usePopstate = () =>
  pipe(
    useEventListener(pipe(getWindow, EO.fromEnv), 'popstate', () => getState),
    EO.getOrElseEW(() => getState),
  )

/**
 * @category Use
 * @since 0.13.2
 */
export const useHashChange = () =>
  pipe(
    useEventListener(pipe(getWindow, EO.fromEnv), 'hashchange', () => getHash),
    EO.getOrElseEW(() => getHash),
  )

/**
 * @category Use
 * @since 0.13.2
 */
export const useWhenUrlChanges = <E, A>(env: E.Env<E, A>) =>
  pipe(env, E.apFirstW(usePopstate()), E.apFirstW(useHashChange()))

/**
 * @category Use
 * @since 0.13.2
 */
export const useLocation = useWhenUrlChanges(getLocation)

/**
 * @category Use
 * @since 0.13.2
 */
export const useHistory = useWhenUrlChanges(getHistory)

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

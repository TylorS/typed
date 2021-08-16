import * as E from './Env'
import * as EO from './EnvOption'
import { constVoid, pipe } from './function'
import * as KV from './KV'
import * as O from './Option'
import * as RS from './ReaderStream'
import { Resume } from './Resume'
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
export type RootElementEnv = { readonly rootElement: HTMLElement }

/**
 * @category DOM
 * @since 0.13.2
 */
export const getRootElement = E.asks((e: RootElementEnv) => e.rootElement)

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelector = <E extends Element>(selector: string) =>
  pipe(
    getRootElement,
    E.chainW((el) => E.fromIO(() => O.fromNullable(el.querySelector<E>(selector)))),
  )

/**
 * @category DOM
 * @since 0.13.2
 */
export const querySelectorAll = <E extends Element>(selector: string) =>
  pipe(
    getRootElement,
    E.chainW((el) => E.fromIO((): readonly E[] => Array.from(el.querySelectorAll<E>(selector)))),
  )

/**
 * Provide the root element to your application by querying for an element in the document
 * @category DOM
 * @since 0.13.2
 */
export const queryRootElement = <E extends HTMLElement>(selector: string) =>
  pipe(
    getDocument,
    E.map((d) => O.fromNullable(d.querySelector<E>(selector))),
    EO.map((rootElement): RootElementEnv => ({ rootElement })),
    EO.getOrElse((): RootElementEnv => {
      throw new Error(`Unable to find root element by selector ${selector}!`)
    }),
  )

/**
 * Common setup for rendering an application into an element queried from the DOM
 * utilizing requestAnimationFrame.
 * @category DOM
 * @since 0.13.2
 */
export const patchKVOnRaf =
  <A>(patch: (element: HTMLElement, renderable: A) => HTMLElement, selector: string) =>
  <E>(env: E.Env<E, A>) =>
    pipe(
      getRootElement,
      RS.fromEnv,
      RS.switchMapW((rootElement) =>
        pipe(
          raf,
          E.chainW(() => env),
          KV.sample,
          RS.scan(patch, rootElement),
        ),
      ),
      RS.provideSomeWithEnv(queryRootElement(selector)),
    )

/**
 * Common setup for rendering an application into an element queried from the DOM
 * utilizing requestAnimationFrame.
 * @category DOM
 * @since 0.13.2
 */
export const patchKVWhenIdle =
  <A>(patch: (element: HTMLElement, renderable: A) => HTMLElement, selector: string) =>
  <E>(env: E.Env<E, A>) =>
    pipe(
      getRootElement,
      RS.fromEnv,
      RS.switchMapW((rootElement) =>
        pipe(
          whenIdle,
          E.chainW(() => env),
          KV.sample,
          RS.scan(patch, rootElement),
        ),
      ),
      RS.provideSomeWithEnv(queryRootElement(selector)),
    )

/**
 * @category Use
 * @since 0.13.2
 */
export const usePopstate = () => {
  const useRS = useReaderStream()

  return pipe(
    getWindow,
    E.chainW((window) =>
      pipe(
        S.newStream<void>((sink, scheduler) => {
          const listener = () => sink.event(scheduler.currentTime())

          window.addEventListener('popstate', listener)

          return { dispose: () => window.removeEventListener('popstate', listener) }
        }),
        RS.fromStream,
        useRS,
      ),
    ),
    EO.getOrElse(constVoid),
  )
}

/**
 * @category Use
 * @since 0.13.2
 */
export const useHashChange = () => {
  const useRS = useReaderStream()

  return pipe(
    getWindow,
    E.chainW((window) =>
      pipe(
        S.newStream<void>((sink, scheduler) => {
          const listener = () => sink.event(scheduler.currentTime())

          window.addEventListener('hashchange', listener)

          return { dispose: () => window.removeEventListener('hashchange', listener) }
        }),
        RS.fromStream,
        useRS,
      ),
    ),
    EO.getOrElse(constVoid),
  )
}

/**
 * @category Use
 * @since 0.13.2
 */
export const useWhenUrlChanges = <E, A>(env: E.Env<E, A>) => {
  const onPopstate = usePopstate()
  const onHashChange = useHashChange()

  return pipe(env, E.apFirstW(onPopstate), E.apFirstW(onHashChange))
}

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
export const navigateTo = (path: string) =>
  pipe(
    getHistory,
    E.chainW((history) => E.fromIO(() => history.pushState(null, '', path))),
  )

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

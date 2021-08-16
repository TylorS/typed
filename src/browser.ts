/**
 * @typed/fp/browser is a place to place implementations of environment from other modules that require or
 * are best used with implementations specificall for the browser.
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import { Adapter } from './Adapter'
import * as D from './Disposable'
import * as E from './Env'
import * as EO from './EnvOption'
import { constVoid, pipe } from './function'
import * as http from './http'
import * as KV from './KV'
import * as RS from './ReaderStream'
import * as R from './Resume'
import { Resume } from './Resume'
import * as S from './Stream'
import { useReaderStream } from './use'

/**
 * @category Environment
 * @since 0.9.4
 */
export const HttpEnv: http.HttpEnv = { http: E.fromResumeK(httpFetchRequest) }

function httpFetchRequest(
  uri: string,
  options: http.HttpOptions = {},
): R.Resume<Ei.Either<Error, http.HttpResponse>> {
  return R.async((cb) => {
    const { method = 'GET', headers = {}, body } = options

    const disposable = D.settable()
    const abortController = new AbortController()

    disposable.addDisposable({
      dispose: () => abortController.abort(),
    })

    const init: RequestInit = {
      method,
      headers: Object.entries(headers).map(([key, value = '']) => [key, value]),
      body,
      credentials: 'include',
      signal: abortController.signal,
    }

    async function makeRequest() {
      const response = await fetch(uri, init)

      const headers: Record<string, string | undefined> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const httpResponse: http.HttpResponse = {
        status: response.status,
        body: await response.json().catch(() => response.text()),
        headers,
      }

      if (!disposable.isDisposed()) {
        disposable.addDisposable(cb(Ei.right(httpResponse)))
      }
    }

    makeRequest().catch((error) => {
      if (!disposable.isDisposed()) {
        disposable.addDisposable(cb(Ei.left(error)))
      }
    })

    return disposable
  })
}

/**
 * Constructs an Adapter that utilizes a BroadcastChannel to communicate messages across
 * all scripts of the same origin, including workers.
 *
 * _Note:_ An error will occur, and the stream will fail, if you send events which cannot be
 * structurally cloned. See
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * @category Constructor
 * @since 0.12.2
 */
export const broadcastChannel = <A>(name: string): Adapter<A> => {
  const channel = new BroadcastChannel(name)
  const send = (event: A) => channel.postMessage(event)
  const stream = S.newStream<A>((sink, scheduler) => {
    const onMessage = (event: MessageEvent<A>) => sink.event(scheduler.currentTime(), event.data)
    const onMessageError = (event: MessageEvent<Error>) =>
      sink.error(scheduler.currentTime(), event.data)

    channel.addEventListener('message', onMessage)
    channel.addEventListener('messageerror', onMessageError)

    return {
      dispose: () => {
        channel.removeEventListener('message', onMessage)
        channel.removeEventListener('messageerror', onMessageError)
      },
    }
  })

  return [send, stream]
}

/**
 * Utilize the Crypto API to generate 8-bit numbers
 * @category Constructor
 * @since 0.12.2
 */
export const random8Bits = (count: number): E.Of<readonly number[]> =>
  E.fromIO(() => [...crypto.getRandomValues(new Uint8Array(count))] as const)

/**
 * Utilize the Crypto API to generate 16-bit numbers
 * @category Constructor
 * @since 0.12.2
 */
export const random16Bits = (count: number): E.Of<readonly number[]> =>
  E.fromIO(() => [...crypto.getRandomValues(new Uint16Array(count))] as const)

/**
 * Utilize the Crypto API to generate 32-bit numbers
 * @category Constructor
 * @since 0.12.2
 */
export const random32Bits = (count: number): E.Of<readonly number[]> =>
  E.fromIO(() => [...crypto.getRandomValues(new Uint32Array(count))] as const)

/**
 * @category Environment
 * @since 0.13.2
 */
export const rafEnv: RafEnv = {
  raf: R.async((resume) => {
    const disposable = D.settable()

    let handle = requestAnimationFrame(
      () => (handle = requestAnimationFrame((n) => disposable.addDisposable(resume(n)))),
    )

    disposable.addDisposable({ dispose: () => cancelAnimationFrame(handle) })

    return disposable
  }),
}

/**
 * @category Environment
 * @since 0.13.2
 */
export const whenIdleEnv: WhenIdleEnv = {
  whenIdle: R.async((cb) => {
    const disposable = D.settable()

    const handle = window.requestIdleCallback((d) => disposable.addDisposable(cb(d)))

    disposable.addDisposable({ dispose: () => cancelAnimationFrame(handle) })

    return disposable
  }),
}

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

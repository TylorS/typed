/**
 * @typed/fp/browser is a place to place implementations of environment from other modules that require or
 * are best used with implementations specificall for the browser.
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'

import { Adapter } from './Adapter'
import * as D from './Disposable'
import * as E from './Env'
import * as http from './http'
import * as R from './Resume'
import { newStream } from './Stream'

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
  const stream = newStream<A>((sink, scheduler) => {
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

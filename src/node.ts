/**
 * @typed/fp/node is a place to place implementations of environment from other modules that require or
 * are best used with implementations specifically for node.js.
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'
import fetch from 'node-fetch'

import * as D from './Disposable'
import * as E from './Env'
import * as http from './http'
import * as R from './Resume'

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

    const init = {
      method,
      headers: Object.entries(headers).map(([key, value = '']) => [key, value]),
      body: body ?? undefined,
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
        response: await response.json().catch(() => response.text()),
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

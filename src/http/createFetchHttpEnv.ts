import { lazy } from '@typed/fp/Disposable'
import { async, Resume } from '@typed/fp/Effect'
import { Uri, uriIso } from '@typed/fp/Uri'
import { Either, left, right } from 'fp-ts/es6/Either'

import { HttpEnv, HttpOptions } from './HttpEnv'
import { HttpResponse } from './HttpResponse'

export const FetchHttEnv: HttpEnv = { http: httpFetchRequest }

function httpFetchRequest(uri: Uri, options: HttpOptions): Resume<Either<Error, HttpResponse>> {
  return async((cb) => {
    const { method = 'GET', headers = {}, body } = options

    const disposable = lazy()
    const abortController = new AbortController()

    disposable.addDisposable({
      dispose: () => abortController.abort(),
    })

    const init: RequestInit = {
      method,
      headers: Object.entries(headers).map(([key, value = '']) => [key, value]),
      body,
      signal: abortController.signal,
    }

    async function makeRequest() {
      const response = await fetch(uriIso.unwrap(uri), init)
      const responseText = await response.text()

      const headers: Record<string, string | undefined> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        responseText,
        headers,
      }

      if (!disposable.disposed) {
        disposable.addDisposable(cb(right(httpResponse)))
      }
    }

    makeRequest().catch((error) => {
      if (!disposable.disposed) {
        disposable.addDisposable(cb(left(error)))
      }
    })

    return disposable
  })
}

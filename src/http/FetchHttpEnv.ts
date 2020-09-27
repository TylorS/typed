import { lazy } from '@typed/fp/Disposable/exports'
import { async, Resume } from '@typed/fp/Effect/exports'
import { Uri, uriIso } from '@typed/fp/Uri/exports'
import { Either, left, right } from 'fp-ts/Either'
import { flow, not, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/lib/Option'

import { HttpEnv, HttpOptions } from './HttpEnv'
import { HttpResponse } from './HttpResponse'

export const FetchHttEnv: HttpEnv = { http: httpFetchRequest }

const utf8Decoder = new TextDecoder('utf-8')

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

      const headers: Record<string, string | undefined> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const total = pipe(
        response.headers.get('Content-Length'),
        O.fromNullable,
        O.map(flow(parseFloat, Math.abs)),
        O.filter<number>(not(Number.isNaN)),
      )

      options.onProgress?.({ loaded: 0, total })

      const responseText = await (options.onProgress
        ? onProgress(response, total, options.onProgress)
        : response.text())

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

async function onProgress(
  response: Response,
  total: O.Option<number>,
  onProgress: NonNullable<HttpOptions['onProgress']>,
): Promise<string> {
  const reader = response.body?.getReader()

  if (!reader) {
    return ''
  }

  const chunks: Array<Uint8Array> = []
  let loaded = 0

  const addChunk = (r: ReadableStreamReadResult<Uint8Array>) => {
    if (r.value) {
      chunks.push(r.value)
      loaded += r.value.length
    }
  }

  let result = await reader.read()

  while (!result.done) {
    addChunk(result)
    onProgress({ loaded, total })

    result = await reader.read()
  }

  if (result.value) {
    addChunk(result)
  }

  onProgress({ loaded, total })

  return combineChunks(chunks, loaded)
}

function combineChunks(chunks: ReadonlyArray<Uint8Array>, loaded: number): string {
  const combined = new Uint8Array(loaded)

  let position = 0
  for (const chunk of chunks) {
    combined.set(chunk, position)

    position += chunk.length
  }

  return utf8Decoder.decode(combined)
}

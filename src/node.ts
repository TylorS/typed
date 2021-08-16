/**
 * @typed/fp/node is a place to place implementations of environment from other modules that require or
 * are best used with implementations specifically for node.js.
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'
import * as fs from 'fs'
import fetch from 'node-fetch'

import * as D from './Disposable'
import * as E from './Env'
import { fromPromiseK } from './EnvEither'
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
 * @category FS
 * @since 0.13.1
 */
export const chmod = fromPromiseK(fs.promises.chmod)

/**
 * @category FS
 * @since 0.13.1
 */
export const copyFile = fromPromiseK(fs.promises.copyFile)

/**
 * @category FS
 * @since 0.13.1
 */
export const link = fromPromiseK(fs.promises.link)

/**
 * @category FS
 * @since 0.13.1
 */
export const mkdir = fromPromiseK(fs.promises.mkdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const read = fromPromiseK(fs.promises.read)

/**
 * @category FS
 * @since 0.13.1
 */
export const readFile = fromPromiseK(fs.promises.readFile)

/**
 * @category FS
 * @since 0.13.1
 */
export const readdir = fromPromiseK(fs.promises.readdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const rm = fromPromiseK(fs.promises.rm)

/**
 * @category FS
 * @since 0.13.1
 */
export const rmdir = fromPromiseK(fs.promises.rmdir)

/**
 * @category FS
 * @since 0.13.1
 */
export const stat = fromPromiseK(fs.promises.stat)

/**
 * @category FS
 * @since 0.13.1
 */
export const symlink = fromPromiseK(fs.promises.symlink)

/**
 * @category FS
 * @since 0.13.1
 */
export const unlink = fromPromiseK(fs.promises.unlink)

/**
 * @category FS
 * @since 0.13.1
 */
export const write = fromPromiseK(fs.promises.write)

/**
 * @category FS
 * @since 0.13.1
 */
export const writeFile = fromPromiseK(fs.promises.writeFile)

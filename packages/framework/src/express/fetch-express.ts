import type { Writable } from 'stream'

import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { ParamsOf } from '@typed/path'
import type express from 'express'

import type { FetchHandler } from '../api/FetchHandler.js'

export function registerFetchHandler<Path extends string>(
  route: express.Router,
  fetchHandler: FetchHandler<never, never, Path>,
) {
  for (const method of fetchHandler.httpMethods) {
    route[method](fetchHandler.route.path, runFetchHandler(fetchHandler))
  }
}

export function runFetchHandler<Path extends string>(
  fetchHandler: FetchHandler<never, never, Path>,
) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const request = makeFetchRequest(req, res)

    const fiber = Effect.runFork(
      pipe(
        fetchHandler.route.match(req.url),
        Option.match(
          () => Effect.sync(next),
          (params) =>
            pipe(
              fetchHandler.handler(request, params as ParamsOf<Path>),
              Effect.flatMap((response) => Effect.promise(() => sendFetchResponse(res, response))),
              // Handle all defects by passing them along to Express' next function.
              Effect.catchAllDefect((defect) => Effect.sync(() => next(defect))),
              // Log about all other defects
              Effect.catchAllCause(Effect.logDebugCause),
            ),
        ),
        // Annotate some request data
        Effect.logAnnotate('request.url', request.url),
        Effect.logAnnotate('request.referrer', request.referrer),
      ),
    )

    // If the request/response are closed, interrupt the fiber.
    request.signal.addEventListener('abort', () => Effect.runFork(Fiber.interrupt(fiber)))
  }
}

export function makeFetchRequest(req: express.Request, res: express.Response) {
  const origin = `${req.protocol}://${getHost(req)}`
  const url = new URL(req.url, origin)
  const controller = new AbortController()

  // If the response has been closed by the client, abort the request.
  res.on('close', () => controller.abort())

  const requestInit: RequestInit = {
    method: req.method,
    headers: makeFetchHeaders(req.headers),
    signal: controller.signal,
  }

  return new Request(url.href, requestInit)
}

export function makeFetchHeaders(requestHeaders: express.Request['headers']): Headers {
  const headers = new Headers()

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value)
        }
      } else {
        headers.set(key, values)
      }
    }
  }

  return headers
}

function getHost(req: express.Request) {
  return req.get('x-forwarded-host') || req.get('host')
}

export async function sendFetchResponse(
  res: express.Response,
  nodeResponse: Response,
): Promise<void> {
  res.statusMessage = nodeResponse.statusText
  res.status(nodeResponse.status)

  for (const [key, values] of Object.entries(nodeResponse.headers)) {
    for (const value of values) {
      res.append(key, value)
    }
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res)
  } else {
    res.end()
  }
}

export async function writeReadableStreamToWritable(stream: ReadableStream, writable: Writable) {
  const reader = stream.getReader()

  async function read() {
    const { done, value } = await reader.read()

    if (done) {
      writable.end()
      return
    }

    writable.write(value)

    // If the stream is flushable, flush it to allow streaming to continue.
    if ('flush' in writable && typeof writable.flush === 'function') {
      writable.flush()
    }

    await read()
  }

  try {
    await read()
  } catch (error: any) {
    writable.destroy(error)
    throw error
  }
}

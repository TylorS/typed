import { whenIdle, WhenIdleEnv } from '@fp/dom/exports'
import { ask, doEffect, Effect, fromTask, Provider, toEnv, useWith } from '@fp/Effect/exports'
import { FiberEnv, fork } from '@fp/Fiber/exports'
import { async, chain, run, sync } from '@fp/Resume/exports'
import { SchedulerEnv } from '@fp/Scheduler/exports'
import { getShared, setShared, Shared, SharedEnv, SharedKey, usingGlobal } from '@fp/Shared/exports'
import { Uri } from '@fp/Uri/exports'
import { disposeBoth } from '@most/disposable'
import { Clock } from '@most/types'
import { Either, isRight, right } from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import { fromNullable, isSome, Option } from 'fp-ts/Option'

import { HttpEnv, HttpOptions } from './HttpEnv'
import { HttpMethod } from './HttpMethod'
import { HttpResponse } from './HttpResponse'
import { zipIterables } from './zipIterables'

// milliseconds
const SECOND = 1000
const MINUTE = 60 * SECOND
const DEFAULT_EXPIRATION = 5 * MINUTE
const DEFAULT_METHODS_TO_CACHE: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS']
const DEFAULT_DEDUPLICATE_REQUESTS = true

export type WithHttpManagementOptions = {
  readonly expirationMs?: number
  readonly methodsToCache?: HttpMethod[]
  readonly deduplicateRequests?: boolean
  readonly getCacheKey?: (url: Uri, options: HttpOptions) => string
  readonly shouldBeCached?: (response: HttpResponse) => boolean
}

export type DeduplicateRequestOptions = {
  readonly expirationMs: string
}

export type Timestamp = ReturnType<Clock['now']>
export type TimestampedResponse = {
  readonly timestamp: Timestamp
  readonly response: HttpResponse
}

export type TimestampedPromise = {
  readonly timestamp: Timestamp
  readonly promise: Promise<Either<Error, HttpResponse>>
}

// TODO: handle duplicated requests??
export interface WithHttpManagementEnv {
  readonly httpCache: Map<string, TimestampedResponse> // Taking advantage of insertion order
  readonly ongoingRequests: Map<Uri, Map<HttpMethod, Map<HttpOptions, TimestampedPromise>>>
  readonly httpCacheCleanupScheduled: Shared<SharedKey, unknown, boolean>
}

/**
 * Create an in-memory cache for GET requests that are periodically cleaned up when the browser
 * is idle.
 */
export const withHttpManagement = (
  options: WithHttpManagementOptions,
): Provider<HttpEnv, HttpEnv & WithHttpManagementEnv & FiberEnv & WhenIdleEnv & SharedEnv> => {
  const { expirationMs: expiration = DEFAULT_EXPIRATION } = options
  const cleanup = clearOldTimestamps(expiration)

  return useWith(
    doEffect(function* () {
      const env = yield* ask<HttpEnv & WithHttpManagementEnv & FiberEnv>()
      const wrappedEnv = createCachedHttpEnv(options, env)
      const cleanupIsScheduled = yield* pipe(env.httpCacheCleanupScheduled, getShared, usingGlobal)

      if (!cleanupIsScheduled) {
        yield* setShared(env.httpCacheCleanupScheduled, true)

        yield* fork(cleanup)
      }

      return wrappedEnv
    }),
  )
}

function createCachedHttpEnv(
  options: WithHttpManagementOptions,
  env: HttpEnv & WithHttpManagementEnv & FiberEnv,
): HttpEnv {
  const {
    expirationMs = DEFAULT_EXPIRATION,
    methodsToCache = DEFAULT_METHODS_TO_CACHE,
    getCacheKey = getDefaultCacheKey,
    shouldBeCached = isValidStatus,
    deduplicateRequests = DEFAULT_DEDUPLICATE_REQUESTS,
  } = options
  const { httpCache, ongoingRequests, scheduler, http } = env

  return {
    http: (uri, options) => {
      const method = options.method ?? 'GET'
      const isCacheable = methodsToCache.includes(method)
      const request = http(uri, options)
      const isOngoing = getOngoingRequest(uri, options, ongoingRequests)

      if (!isCacheable) {
        return request
      }

      if (deduplicateRequests && isSome(isOngoing)) {
        const { timestamp, promise } = isOngoing.value
        const timeSince = scheduler.currentTime() - timestamp

        // If not expired, return the ongoing request
        if (timeSince < expirationMs) {
          return toEnv(fromTask(() => promise))({})
        }

        ongoingRequests.get(uri)?.get(method)?.delete(options)
      }

      const now = scheduler.currentTime()
      const earliestTimestampToUse = now - expirationMs
      const key = getCacheKey(uri, options)
      const lastResponse = httpCache.get(key)

      if (lastResponse && lastResponse.timestamp > earliestTimestampToUse) {
        return sync(right(lastResponse.response))
      }

      const { byOptions } = createOngoingRequestMap(uri, options, ongoingRequests)

      let resolve: (value: Either<Error, HttpResponse>) => void = constVoid
      let reject: (value: Error) => void = constVoid
      const promise = new Promise<Either<Error, HttpResponse>>((res, rej) => {
        resolve = res
        reject = rej
      })

      byOptions.set(options, { timestamp: now, promise })

      const resume = pipe(
        request,
        chain((response) => {
          if (isRight(response) && shouldBeCached(response.right)) {
            httpCache.set(key, { timestamp: scheduler.currentTime(), response: response.right })
          }

          byOptions.delete(options)
          resolve(response)

          return sync(response)
        }),
      )

      return async((cb) =>
        disposeBoth({ dispose: () => reject(new Error('disposed')) }, run(resume, cb)),
      )
    },
  }
}

const getDefaultCacheKey = (url: Uri, options: HttpOptions): string => url + (options.method ?? '')

function isValidStatus({ status }: HttpResponse) {
  return status >= 200 && status < 300
}

const clearOldTimestamps = (
  expiration: number,
): Effect<WithHttpManagementEnv & SchedulerEnv & FiberEnv & WhenIdleEnv & SharedEnv, void> =>
  doEffect(function* () {
    const { httpCache, httpCacheCleanupScheduled, ongoingRequests, scheduler } = yield* ask<
      WithHttpManagementEnv & SchedulerEnv
    >()
    const expired = scheduler.currentTime() - expiration
    const deadline = yield* whenIdle()
    const iterator = zipIterables(httpCache.entries(), ongoingRequestGenerator(ongoingRequests))[
      Symbol.iterator
    ]()

    let result = iterator.next()

    while (deadline.timeRemaining() > 0 && !result.done) {
      const [
        [key, { timestamp }],
        { uri, method, options, timestamp: requestTimestamp },
      ] = result.value
      const cacheExpired = timestamp <= expired
      const requestExpired = requestTimestamp <= expired

      if (cacheExpired) {
        httpCache.delete(key)
      }

      if (requestExpired) {
        const byMethod = ongoingRequests.get(uri)!
        const byOptions = byMethod.get(method)!

        byOptions.delete(options)

        if (byOptions.size === 0) {
          byMethod.delete(method)
        }

        if (byMethod.size === 0) {
          ongoingRequests.delete(uri)
        }
      }

      result = iterator.next()
    }

    if (result.done) {
      yield* usingGlobal(setShared(httpCacheCleanupScheduled, false))

      return
    }

    yield* fork(clearOldTimestamps(expiration))
  })

function getOngoingRequest(
  uri: Uri,
  options: HttpOptions,
  ongoingRequests: WithHttpManagementEnv['ongoingRequests'],
): Option<TimestampedPromise> {
  return fromNullable(
    ongoingRequests
      .get(uri)
      ?.get(options.method ?? 'GET')
      ?.get(options),
  )
}

function createOngoingRequestMap(
  uri: Uri,
  options: HttpOptions,
  ongoingRequests: WithHttpManagementEnv['ongoingRequests'],
) {
  if (!ongoingRequests.has(uri)) {
    ongoingRequests.set(uri, new Map())
  }

  const byMethod = ongoingRequests.get(uri)!
  const method = options.method ?? 'GET'

  if (!byMethod.has(method)) {
    byMethod.set(method, new Map())
  }

  const byOptions = byMethod.get(method)!

  return {
    byMethod,
    byOptions,
  } as const
}

function* ongoingRequestGenerator(
  ongoingRequests: Map<Uri, Map<HttpMethod, Map<HttpOptions, TimestampedPromise>>>,
) {
  for (const [uri, byMethod] of ongoingRequests) {
    for (const [method, byOptions] of byMethod) {
      for (const [options, { timestamp }] of byOptions) {
        yield { uri, method, options, timestamp } as const
      }
    }
  }
}

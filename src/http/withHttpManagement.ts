import { Clock } from '@most/types'
import { whenIdle, WhenIdleEnv } from '@typed/fp/dom'
import { ask, doEffect, Effect, sync, useWith } from '@typed/fp/Effect'
import { chainResume } from '@typed/fp/Effect/chainResume'
import { FiberEnv, fork, SchedulerEnv } from '@typed/fp/fibers'
import { readSharedRef, SharedRef, SharedRefEnv, writeSharedRef } from '@typed/fp/SharedRef'
import { Uri } from '@typed/fp/Uri'
import { right } from 'fp-ts/es6/Either'
import { isRight } from 'fp-ts/lib/These'

import { HttpEnv, HttpOptions } from './HttpEnv'
import { HttpMethod } from './HttpMethod'
import { HttpResponse } from './HttpResponse'

// milliseconds
const SECOND = 1000
const MINUTE = 60 * SECOND
const DEFAULT_EXPIRATION = 5 * MINUTE
const DEFAULT_METHODS_TO_CACHE: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS']

export type WithHttpManagementOptions = {
  readonly expiration?: number
  readonly methodsToCache?: HttpMethod[]
  readonly getCacheKey?: (url: Uri, options: HttpOptions) => string
  readonly shouldBeCached?: (response: HttpResponse) => boolean
}

export type Timestamp = ReturnType<Clock['now']>
export type TimestampedResponse = {
  readonly timestamp: Timestamp
  readonly response: HttpResponse
}

// TODO: handle duplicated requests??
export interface WithHttpManagementEnv {
  readonly httpCache: Map<string, TimestampedResponse> // Taking advantage of insertion order
  readonly httpCacheCleanupScheduled: SharedRef<unknown, boolean>
}

export const withHttpManagement = (options: WithHttpManagementOptions) => {
  const { expiration = DEFAULT_EXPIRATION } = options
  const cleanup = clearOldTimestamps(expiration)

  return useWith(
    doEffect(function* () {
      const env = yield* ask<HttpEnv & WithHttpManagementEnv & FiberEnv>()
      const wrappedEnv = createCachedHttpEnv(options, env)
      const cleanupIsScheduled = yield* readSharedRef(env.httpCacheCleanupScheduled)

      if (!cleanupIsScheduled) {
        yield* writeSharedRef(env.httpCacheCleanupScheduled, true)

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
    expiration = DEFAULT_EXPIRATION,
    methodsToCache = DEFAULT_METHODS_TO_CACHE,
    getCacheKey = getDefaultCacheKey,
    shouldBeCached = isValidStatus,
  } = options
  const { httpCache, scheduler, http } = env

  return {
    http: (uri, options) => {
      const isCacheable = methodsToCache.includes(options.method || 'GET')
      const request = http(uri, options)

      if (!isCacheable) {
        return request
      }

      const now = scheduler.currentTime()
      const earliestTimestampToUse = now - expiration
      const key = getCacheKey(uri, options)
      const lastResponse = httpCache.get(key)

      if (lastResponse && lastResponse.timestamp > earliestTimestampToUse) {
        return sync(right(lastResponse.response))
      }

      return chainResume(request, (response) => {
        if (isRight(response) && shouldBeCached(response.right)) {
          httpCache.set(key, { timestamp: scheduler.currentTime(), response: response.right })
        }

        return sync(response)
      })
    },
  }
}

const getDefaultCacheKey = (url: Uri, options: HttpOptions): string => url + (options.method ?? '')

function isValidStatus({ status }: HttpResponse) {
  return status >= 200 && status < 300
}

const clearOldTimestamps = (
  expiration: number,
): Effect<
  WithHttpManagementEnv &
    SchedulerEnv &
    FiberEnv &
    WhenIdleEnv &
    SharedRefEnv<SharedRef<unknown, boolean>>,
  void
> =>
  doEffect(function* () {
    const { httpCache, httpCacheCleanupScheduled, scheduler } = yield* ask<
      WithHttpManagementEnv & SchedulerEnv
    >()
    const expired = scheduler.currentTime() - expiration
    const iterator = httpCache.entries()[Symbol.iterator]()
    const deadline = yield* whenIdle()

    let current: IteratorResult<[string, TimestampedResponse]> = iterator.next()
    let notCurrentlyExpired = false

    while (deadline.timeRemaining() > 0 && !deadline.didTimeout && !current.done) {
      const [key, { timestamp }] = current.value

      if (timestamp <= expired) {
        httpCache.delete(key)
      } else {
        // Since insertion order will be time dependent, once reaching an item that is not expired
        // we can bail out
        notCurrentlyExpired = true

        break
      }

      current = iterator.next()
    }

    if (notCurrentlyExpired || current.done) {
      yield* writeSharedRef(httpCacheCleanupScheduled, false)

      return
    }

    yield* fork(clearOldTimestamps(expiration))
  })

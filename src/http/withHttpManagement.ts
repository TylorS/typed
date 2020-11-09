import { Clock } from '@most/types'
import { whenIdle, WhenIdleEnv } from '@typed/fp/dom/exports'
import { ask, doEffect, Effect, Provider, useWith } from '@typed/fp/Effect/exports'
import { FiberEnv, fork } from '@typed/fp/Fiber/exports'
import { chain, sync } from '@typed/fp/Resume/exports'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'
import {
  getShared,
  setShared,
  Shared,
  SharedEnv,
  SharedKey,
  usingGlobal,
} from '@typed/fp/Shared/exports'
import { Uri } from '@typed/fp/Uri/exports'
import { isRight, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

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
  readonly httpCacheCleanupScheduled: Shared<SharedKey, unknown, boolean>
}

export const withHttpManagement = (
  options: WithHttpManagementOptions,
): Provider<HttpEnv, HttpEnv & WithHttpManagementEnv & FiberEnv & WhenIdleEnv & SharedEnv> => {
  const { expiration = DEFAULT_EXPIRATION } = options
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

      return chain((response) => {
        if (isRight(response) && shouldBeCached(response.right)) {
          httpCache.set(key, { timestamp: scheduler.currentTime(), response: response.right })
        }

        return sync(response)
      }, request)
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
      yield* usingGlobal(setShared(httpCacheCleanupScheduled, false))

      return
    }

    yield* fork(clearOldTimestamps(expiration))
  })

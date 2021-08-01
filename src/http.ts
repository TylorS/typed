/**
 * @typed/fp/http is a basic abstraction over HTTP using Env
 * @since 0.9.4
 */
import * as Ei from 'fp-ts/Either'

import * as E from './Env'

/**
 * @category Model
 * @since 0.9.4
 */
export type HttpHeaders = Readonly<Record<string, string | undefined>>

/**
 * @category Model
 * @since 0.9.4
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD'

/**
 * @category Model
 * @since 0.9.4
 */
export interface HttpResponse {
  readonly responseText: string
  readonly status: number
  readonly statusText: string
  readonly headers: HttpHeaders
}

/**
 * @category Options
 * @since 0.9.4
 */
export type HttpOptions = {
  readonly method?: HttpMethod
  readonly headers?: HttpHeaders
  readonly body?: string
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export const http =
  E.op<(url: string, options?: HttpOptions) => E.Of<Ei.Either<Error, HttpResponse>>>()('http')

/**
 * @category Environment
 * @since 0.9.4
 */
export type HttpEnv = E.RequirementsOf<typeof http>

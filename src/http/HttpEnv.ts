import type { Progress } from '@fp/RemoteData/exports'
import type { Resume } from '@fp/Resume/exports'
import type { Uri } from '@fp/Uri/exports'
import type { Either } from 'fp-ts/Either'

import type { HttpHeaders } from './HttpHeaders'
import type { HttpMethod } from './HttpMethod'
import type { HttpResponse } from './HttpResponse'

/**
 * An environment type for performning HttpRequests
 */
export interface HttpEnv {
  readonly http: (uri: Uri, options: HttpOptions) => Resume<Either<Error, HttpResponse>>
}

export type HttpOptions = {
  readonly method?: HttpMethod
  readonly headers?: HttpHeaders
  readonly body?: string | File | ArrayBuffer | FormData
  readonly onProgress?: (progress: Progress) => void
}

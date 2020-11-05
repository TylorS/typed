import type { Disposable } from '@typed/fp/Disposable/exports'
import type { Progress } from '@typed/fp/RemoteData/exports'
import type { Resume } from '@typed/fp/Resume/exports'
import type { Uri } from '@typed/fp/Uri/exports'
import type { Either } from 'fp-ts/Either'

import type { HttpHeaders } from './HttpHeaders'
import type { HttpMethod } from './HttpMethod'
import type { HttpResponse } from './HttpResponse'

export interface HttpEnv {
  readonly http: (uri: Uri, options: HttpOptions) => Resume<Either<Error, HttpResponse>>
}

export type HttpOptions = {
  readonly method?: HttpMethod
  readonly headers?: HttpHeaders
  readonly body?: string | File | ArrayBuffer | FormData
  readonly onProgress?: (progress: Progress) => void
}

export type HttpCallbacks = {
  readonly success: (response: HttpResponse) => Disposable
  readonly failure: (error: Error) => Disposable
}

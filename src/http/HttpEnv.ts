import { Disposable } from '@typed/fp/Disposable/exports'
import { Resume } from '@typed/fp/Effect/exports'
import { Progress } from '@typed/fp/RemoteData/exports'
import { Uri } from '@typed/fp/Uri/exports'
import { Either } from 'fp-ts/Either'

import { HttpHeaders } from './HttpHeaders'
import { HttpMethod } from './HttpMethod'
import { HttpResponse } from './HttpResponse'

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

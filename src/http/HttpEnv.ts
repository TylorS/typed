import { Disposable } from '@typed/fp/Disposable'
import { Resume } from '@typed/fp/Effect'
import { Uri } from '@typed/fp/Uri'
import { Either } from 'fp-ts/es6/Either'

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
}

export type HttpCallbacks = {
  readonly success: (response: HttpResponse) => Disposable
  readonly failure: (error: Error) => Disposable
}

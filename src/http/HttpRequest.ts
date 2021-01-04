import { Future } from '@fp/Future/exports'

import { HttpEnv } from './HttpEnv'
import { HttpResponse } from './HttpResponse'

/**
 * An Effect representing an Http Request that can fail with an Error
 */
export interface HttpRequest extends Future<HttpEnv, Error, HttpResponse> {}

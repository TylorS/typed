import { Future } from '@typed/fp/Future'

import { HttpEnv } from './HttpEnv'
import { HttpResponse } from './HttpResponse'

export interface HttpRequest extends Future<HttpEnv, Error, HttpResponse> {}

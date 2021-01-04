import { fromEnv } from '@fp/Effect/exports'
import { Uri } from '@fp/Uri/exports'

import { HttpOptions } from './HttpEnv'
import { HttpRequest } from './HttpRequest'

/**
 * An Effect for performing Http Requests
 */
export const http = (uri: Uri, options: HttpOptions = {}): HttpRequest =>
  fromEnv((e) => e.http(uri, options))

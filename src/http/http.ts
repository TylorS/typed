import { fromEnv } from '@typed/fp/Effect/exports'
import { Uri } from '@typed/fp/Uri/exports'

import { HttpOptions } from './HttpEnv'
import { HttpRequest } from './HttpRequest'

export const http = (uri: Uri, options: HttpOptions = {}): HttpRequest =>
  fromEnv((e) => e.http(uri, options))

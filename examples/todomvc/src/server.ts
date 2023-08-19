/// <reference types="@typed/framework" />

import * as Effect from '@effect/io/Effect'
import * as Runtime from '@effect/platform-node/Runtime'
import { spa } from '@typed/framework/server'
import * as Fx from '@typed/fx'
import * as index from 'html:./index'

import { Live } from './infrastructure.js'
import { TodoApp } from './presentation.js'

const app = TodoApp.pipe(Fx.provideSomeLayer(Live))

spa(index, () => app, { port: 3000, staticFiles: import.meta.env.PROD }).pipe(
  Effect.tapErrorCause(Effect.logError),
  Runtime.runMain,
)

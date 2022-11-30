import { Context } from '@fp-ts/data/Context'
import { Option } from '@fp-ts/data/Option'

import { FiberId } from '../fiber/FiberId.js'
import { FiberRefs } from '../fiberRefs/fiberRefs.js'
import { FiberScope } from '../fiberScope/FiberScope.js'
import { Platform } from '../platform/platform.js'
import { RuntimeFlags } from '../runtimeFlags/RuntimeFlags.js'

export interface RuntimeOptions<R> {
  readonly context: Context<R>
  readonly fiberRefs: FiberRefs
  readonly flags: RuntimeFlags
  readonly id: FiberId
  readonly parent: Option<RuntimeOptions<unknown>>
  readonly platform: Platform
  readonly scope: FiberScope
}

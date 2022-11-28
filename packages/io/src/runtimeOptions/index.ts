import { Option } from '@fp-ts/data/Option'

import { FiberId } from '../fiber/FiberId.js'
import { FiberRefs } from '../fiberRefs/fiberRefs.js'
import { FiberScope } from '../fiberScope/FiberScope.js'
import { Platform } from '../platform/platform.js'

export interface RuntimeOptions {
  readonly fiberRefs: FiberRefs
  readonly id: FiberId
  readonly platform: Platform
  readonly scope: FiberScope
  readonly parent: Option<RuntimeOptions>
}

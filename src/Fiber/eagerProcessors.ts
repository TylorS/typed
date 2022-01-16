import { Processors } from './InstructionProcessor'
import { processAccess } from './processAccess'
import { processChain } from './processChain'
import { processFromExit } from './processFromExit'
import { processFromIO } from './processFromIO'
import { processFromPromise } from './processFromPromise'
import { processFromTuple } from './processFromTuple'
import { processGetContext } from './processGetContext'
import { processGetScope } from './processGetScope'
import { processLazy } from './processLazy'
import { processMatch } from './processMatch'
import { processProvide } from './processProvide'
import { processRace } from './processRace'
import { processRefine } from './processRefine'
import { processResult } from './processResult'
import { processSuspend } from './processSuspend'
import { processTrace } from './processTrace'
import { processTracingStatus } from './processTracingStatus'

export const eagerProcessors: Processors = {
  Access: processAccess,
  Chain: processChain,
  FromIO: processFromIO,
  FromExit: processFromExit,
  FromPromise: processFromPromise,
  FromTuple: processFromTuple,
  GetContext: processGetContext,
  GetScope: processGetScope,
  Lazy: processLazy,
  Match: processMatch,
  Provide: processProvide,
  Race: processRace,
  Refine: processRefine,
  Result: processResult,
  Suspend: processSuspend,
  Trace: processTrace,
  TracingStatus: processTracingStatus,
}

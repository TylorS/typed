import { Processors } from './InstructionProcessor'
import { processAccess } from './processAccess'
import { processChain } from './processChain'
import { processFork } from './processFork'
import { processFromAsync } from './processFromAsync'
import { processFromExit } from './processFromExit'
import { processFromIO } from './processFromIO'
import { processFromPromise } from './processFromPromise'
import { processFromTuple } from './processFromTuple'
import { processGetContext } from './processGetContext'
import { processGetScope } from './processGetScope'
import { processJoin } from './processJoin'
import { processLazy } from './processLazy'
import { processMatch } from './processMatch'
import { processProvide } from './processProvide'
import { processRace } from './processRace'
import { processRefine } from './processRefine'
import { processResult } from './processResult'
import { processSuspend } from './processSuspend'
import { processTrace } from './processTrace'
import { processTracingStatus } from './processTracingStatus'

/**
 * Instance of Processors that is NOT lazy-loaded, and will add all processors to your bundles
 * synchronously and completely.
 */
export const eagerProcessors: Processors = {
  Access: processAccess,
  Chain: processChain,
  Fork: processFork,
  FromAsync: processFromAsync,
  FromIO: processFromIO,
  FromExit: processFromExit,
  FromPromise: processFromPromise,
  FromTuple: processFromTuple,
  GetContext: processGetContext,
  GetScope: processGetScope,
  Join: processJoin,
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

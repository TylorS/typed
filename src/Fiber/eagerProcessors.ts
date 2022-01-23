import { processAccess } from './processAccess'
import { processChain } from './processChain'
import { processDrain } from './processDrain'
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
import { Processors } from './Processor'
import { processProvide } from './processProvide'
import { processRace } from './processRace'
import { processRefine } from './processRefine'
import { processResult } from './processResult'
import { processSuspend } from './processSuspsend'
import { processTrace } from './processTrace'
import { processTracingStatus } from './processTracingStatus'

export const eagerProcessors: Processors = {
  Access: processAccess,
  Chain: processChain,
  Drain: processDrain,
  Fork: processFork,
  FromAsync: processFromAsync,
  FromExit: processFromExit,
  FromIO: processFromIO,
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

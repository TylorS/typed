import { InstructionType, Processor, Processors } from './Processor'
import { ResumePromise } from './RuntimeInstruction'

export const lazyProcessors: Processors = {
  Access: lazyLoadProcessor(() => import('./processAccess').then((m) => m.processAccess)),
  Chain: lazyLoadProcessor(() => import('./processChain').then((m) => m.processChain)),
  Drain: lazyLoadProcessor(() => import('./processDrain').then((m) => m.processDrain)),
  Fork: lazyLoadProcessor(() => import('./processFork').then((m) => m.processFork)),
  FromAsync: lazyLoadProcessor(() => import('./processFromAsync').then((m) => m.processFromAsync)),
  FromExit: lazyLoadProcessor(() => import('./processFromExit').then((m) => m.processFromExit)),
  FromIO: lazyLoadProcessor(() => import('./processFromIO').then((m) => m.processFromIO)),
  FromPromise: lazyLoadProcessor(() =>
    import('./processFromPromise').then((m) => m.processFromPromise),
  ),
  FromTuple: lazyLoadProcessor(() => import('./processFromTuple').then((m) => m.processFromTuple)),
  GetContext: lazyLoadProcessor(() =>
    import('./processGetContext').then((m) => m.processGetContext),
  ),
  GetScope: lazyLoadProcessor(() => import('./processGetScope').then((m) => m.processGetScope)),
  Join: lazyLoadProcessor(() => import('./processJoin').then((m) => m.processJoin)),
  Lazy: lazyLoadProcessor(() => import('./processLazy').then((m) => m.processLazy)),
  Match: lazyLoadProcessor(() => import('./processMatch').then((m) => m.processMatch)),
  Provide: lazyLoadProcessor(() => import('./processProvide').then((m) => m.processProvide)),
  Race: lazyLoadProcessor(() => import('./processRace').then((m) => m.processRace)),
  Refine: lazyLoadProcessor(() => import('./processRefine').then((m) => m.processRefine)),
  Result: lazyLoadProcessor(() => import('./processResult').then((m) => m.processResult)),
  Suspend: lazyLoadProcessor(() => import('./processSuspend').then((m) => m.processSuspend)),
  Trace: lazyLoadProcessor(() => import('./processTrace').then((m) => m.processTrace)),
  TracingStatus: lazyLoadProcessor(() =>
    import('./processTracingStatus').then((m) => m.processTracingStatus),
  ),
  WithinContext: lazyLoadProcessor(() =>
    import('./processWithinContext').then((m) => m.processWithinContext),
  ),
}

const memoized = new WeakMap<() => Promise<Processor<any, any, any>>, Processor<any, any, any>>()
const fetching = new WeakMap<
  () => Promise<Processor<any, any, any>>,
  Promise<Processor<any, any, any>>
>()

export function lazyLoadProcessor<T extends InstructionType, E, A>(
  f: () => Promise<Processor<T, E, A>>,
): Processor<T, E, A> {
  return (instr, processor) => {
    if (memoized.has(f)) {
      return memoized.get(f)!(instr, processor)
    }

    return new ResumePromise(async () => {
      const p = await (fetching.has(f) ? fetching.get(f)! : fetching.set(f, f()).get(f)!)

      memoized.set(f, p)
      fetching.delete(f)

      return p(instr, processor)
    })
  }
}

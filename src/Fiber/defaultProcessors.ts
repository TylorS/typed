import { DisposableQueue } from '@/Disposable'
import { unexpected } from '@/Exit'

import { Instruction } from './Instruction'
import { Processors } from './InstructionProcessor'
import { Processor, ResumeDeferred, ResumeNode } from './Processor'

// Avoid loading Processor more than once
const memoized = new WeakMap<() => Promise<Processor<any, any, any>>, Processor<any, any, any>>()
const inProgress = new WeakMap<
  () => Promise<Processor<any, any, any>>,
  Promise<Processor<any, any, any>>
>()

/**
 * The Default Processors are lazy-loaded as each processor is required by the running program to avoid
 * adding to your bundle for features you do not use. There will be some overhead in requesting each processor
 * asynchronously initially, but are then memoized for performance.
 */
export const defaultProcessors: Processors = {
  Access: lazyLoad<'Access'>(() => import('./processAccess').then((m) => m.processAccess)),
  Chain: lazyLoad<'Chain'>(() => import('./processChain').then((m) => m.processChain)),
  // eslint-disable-next-line import/no-cycle
  Fork: lazyLoad<'Fork'>(() => import('./processFork').then((m) => m.processFork)),
  FromAsync: lazyLoad<'FromAsync'>(() =>
    import('./processFromAsync').then((m) => m.processFromAsync),
  ),
  FromExit: lazyLoad<'FromExit'>(() => import('./processFromExit').then((m) => m.processFromExit)),
  FromIO: lazyLoad<'FromIO'>(() => import('./processFromIO').then((m) => m.processFromIO)),
  FromPromise: lazyLoad<'FromPromise'>(() =>
    import('./processFromPromise').then((m) => m.processFromPromise),
  ),
  FromTuple: lazyLoad<'FromTuple'>(() =>
    import('./processFromTuple').then((m) => m.processFromTuple),
  ),
  GetContext: lazyLoad<'GetContext'>(() =>
    import('./processGetContext').then((m) => m.processGetContext),
  ),
  GetScope: lazyLoad<'GetScope'>(() => import('./processGetScope').then((m) => m.processGetScope)),
  Join: lazyLoad<'Join'>(() => import('./processJoin').then((m) => m.processJoin)),
  Lazy: lazyLoad<'Lazy'>(() => import('./processLazy').then((m) => m.processLazy)),
  Match: lazyLoad<'Match'>(() => import('./processMatch').then((m) => m.processMatch)),
  Provide: lazyLoad<'Provide'>(() => import('./processProvide').then((m) => m.processProvide)),
  Race: lazyLoad<'Race'>(() => import('./processRace').then((m) => m.processRace)),
  Refine: lazyLoad<'Refine'>(() => import('./processRefine').then((m) => m.processRefine)),
  Result: lazyLoad<'Result'>(() => import('./processResult').then((m) => m.processResult)),
  Suspend: lazyLoad<'Suspend'>(() => import('./processSuspend').then((m) => m.processSuspend)),
  Trace: lazyLoad<'Trace'>(() => import('./processTrace').then((m) => m.processTrace)),
  TracingStatus: lazyLoad<'TracingStatus'>(() =>
    import('./processTracingStatus').then((m) => m.processTracingStatus),
  ),
}

function lazyLoad<Type extends Instruction<any, any>['type']>(
  f: () => Promise<Processor<any, any, Type>>,
): Processor<any, any, any> {
  return memoized.has(f)
    ? memoized.get(f)!
    : (...args) =>
        new ResumeDeferred<any, any, any>((cb) => {
          const disposable = new DisposableQueue()
          const promise = inProgress.has(f) ? inProgress.get(f)! : inProgress.set(f, f()).get(f)!

          promise
            .then((processor) => {
              memoized.set(f, processor)
              inProgress.delete(f)

              if (!disposable.isDisposed()) {
                cb(processor(...args))
              }
            })
            .catch((error) => {
              inProgress.delete(f)

              if (!disposable.isDisposed()) {
                cb(new ResumeNode({ type: 'Exit', exit: unexpected(error) }))
              }
            })

          return disposable
        })
}

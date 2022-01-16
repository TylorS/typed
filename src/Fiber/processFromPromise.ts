import { DisposableQueue } from '@/Disposable'
import { FromPromise } from '@/Effect/FromPromise'
import { unexpected } from '@/Exit'

import { ResumeDeferred, ResumeNode, ResumeSync } from './Processor'

export const processFromPromise = <A>(instruction: FromPromise<A>) =>
  new ResumeDeferred((cb) => {
    const disposable = new DisposableQueue()

    instruction
      .input()
      .then((a) => !disposable.isDisposed() && cb(new ResumeSync(a)))
      .catch((error) => cb(new ResumeNode({ type: 'Exit', exit: unexpected(error) })))

    return disposable
  })

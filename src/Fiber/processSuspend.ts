import { DisposableQueue } from '@/Disposable'

import { ResumeAsync } from './Processor'

export const processSuspend = () =>
  new ResumeAsync<void>((cb) => {
    const d = new DisposableQueue()

    Promise.resolve().then(() => {
      if (!d.isDisposed()) {
        cb()
      }
    })

    return d
  })

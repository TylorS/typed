import { ResumePromise } from './RuntimeInstruction'

export const processSuspend = () => new ResumePromise(Promise.resolve)

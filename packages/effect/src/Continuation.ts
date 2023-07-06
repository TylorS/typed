import type { Handlers } from './Handlers.js'
import type { StackFrames } from './StackFrames.js'

export interface Continuation {
  readonly frames: StackFrames // The Frames to be executed after resuming
  readonly handlers: Handlers // The Handlers to be used after resuming
}

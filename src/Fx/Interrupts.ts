import { instr } from '@/internal'

export class InterruptableStatusInstruction extends instr('InterruptibleStatus')<
  unknown,
  never,
  boolean
> {
  constructor(readonly isInterruptible: boolean) {
    super()
  }
}

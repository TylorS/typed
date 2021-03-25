import { GetRequirements, op } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

/**
 * Pause the current fiber and wait for the parent fiber to decide when
 * to continue.
 */
export const pause = op<() => Resume<boolean>>()('pause')((f) => f())

export type Pause = GetRequirements<typeof pause>

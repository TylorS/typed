import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'

export type RandomInt = {
  readonly randomInt: (min: number, max: number) => Resume<number>
}

/**
 * Get a random integer between a min and max
 */
export const randomInt =
  (min: number, max: number): Env<RandomInt, number> =>
  (e) =>
    e.randomInt(min, max)

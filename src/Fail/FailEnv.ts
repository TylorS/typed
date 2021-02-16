import { Resume } from '@typed/fp/Resume'

/**
 * An Environment requirement for failures that do not resume
 */
export type FailEnv<Name extends PropertyKey, E> = {
  readonly [K in Name]: (error: E) => Resume<never>
}

import { Newtype } from 'newtype-ts'

// Opaque type used to represent the current implementations requirements to run a nested hook-enabled effect
export interface HookRequirements
  extends Newtype<{ readonly HookRequirements: unique symbol }, unknown> {}

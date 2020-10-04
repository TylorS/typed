import { describe, given, it } from '@typed/test'

export const test = describe(`HookEvents`, [
  describe(`sendHookEvent`, [given(`a HookEvent`, [it(`sends a HookEvent`, () => {})])]),
  describe(`listenToHookEvents`, [
    given(`a refinement and and event handler`, [
      it(`subscribes and filters hook events`, ({}) => {}),
    ]),
  ]),
])

import { describe, given, it } from '@typed/test'

export const test = describe(`ChannelProviders`, [
  describe(`getChannelProvider`, [
    given(`Channel<E, A> and Eq<A>`, [
      it(`returns the root HookEnvironment when no provider has be specified`, ({}) => {}),
      it(`returns the closest specified HookEnvironment`, ({}) => {}),
    ]),
  ]),
  describe(`setChannelProvider`, [
    given(`Channel<E, A> and Eq<A>`, [
      it(`emits update events when a new value is provided`, ({}) => {}),
    ]),
  ]),
  describe(`deleteChannelProvider`, [
    given(`HookEnvironmentId`, [
      it(`deletes all provides associated with that HookEnvironmentId`, ({}) => {}),
    ]),
  ]),
])

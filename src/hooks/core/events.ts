import { ChannelName } from './Channel'
import { HookEnvironment } from './HookEnvironment'

export type HookEvent<A = any> =
  | CreatedHookEnvironment
  | UpdatedHookEnvironment
  | RunningHookEnvironment
  | RemovedHookEnvironment
  | ChannelUpdated<A>

export enum HookEventType {
  CreatedEnvironment = 'hookEnvironment/created',
  UpdatedEnvironment = 'hookEnvironment/updated',
  RunningEnvironment = 'hookEnvironment/running',
  RemovedEnvironment = 'hookEnvironment/removed',
  UpdatedChannel = 'channel/updated',
}

export interface CreatedHookEnvironment {
  readonly type: HookEventType.CreatedEnvironment
  readonly hookEnvironment: HookEnvironment
}

export namespace CreatedHookEnvironment {
  export const of = (hookEnvironment: HookEnvironment): CreatedHookEnvironment => ({
    type: HookEventType.CreatedEnvironment,
    hookEnvironment,
  })
}

export interface UpdatedHookEnvironment {
  readonly type: HookEventType.UpdatedEnvironment
  readonly hookEnvironment: HookEnvironment
  readonly symbol: symbol
  readonly currentValue: unknown
  readonly updatedValue: unknown
}

export namespace UpdatedHookEnvironment {
  export const of = (event: Omit<UpdatedHookEnvironment, 'type'>): UpdatedHookEnvironment => ({
    type: HookEventType.UpdatedEnvironment,
    ...event,
  })
}

export interface RunningHookEnvironment {
  readonly type: HookEventType.RunningEnvironment
  readonly hookEnvironment: HookEnvironment
}

export namespace RunningHookEnvironment {
  export const of = (hookEnvironment: HookEnvironment): RunningHookEnvironment => ({
    type: HookEventType.RunningEnvironment,
    hookEnvironment,
  })
}

export interface RemovedHookEnvironment {
  readonly type: HookEventType.RemovedEnvironment
  readonly hookEnvironment: HookEnvironment
}

export namespace RemovedHookEnvironment {
  export const of = (hookEnvironment: HookEnvironment): RemovedHookEnvironment => ({
    type: HookEventType.RemovedEnvironment,
    hookEnvironment,
  })
}

export interface ChannelUpdated<A> {
  readonly type: HookEventType.UpdatedChannel
  readonly channel: ChannelName
  readonly hookEnvironment: HookEnvironment
  readonly currentValue: A
  readonly updatedValue: A
}

export namespace ChannelUpdated {
  export const of = <A>(options: Omit<ChannelUpdated<A>, 'type'>): ChannelUpdated<A> => ({
    type: HookEventType.UpdatedChannel,
    ...options,
  })
}

export const isRemovedHookEnvironmentEvent = (e: HookEvent): e is RemovedHookEnvironment =>
  e.type === HookEventType.RemovedEnvironment

export const isUpdatedHookEnvironmentEvent = (e: HookEvent): e is UpdatedHookEnvironment =>
  e.type === HookEventType.UpdatedEnvironment

export const isRunningHookEnvironmentEvent = (e: HookEvent): e is RunningHookEnvironment =>
  e.type === HookEventType.RunningEnvironment

export const isCreatedHookEnvironmentEvent = (e: HookEvent): e is CreatedHookEnvironment =>
  e.type === HookEventType.CreatedEnvironment

export const isUpdatedChannelEvent = (e: HookEvent): e is ChannelUpdated<unknown> =>
  e.type === HookEventType.UpdatedChannel

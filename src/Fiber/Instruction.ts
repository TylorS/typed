import { WithinContext } from '@/Effect'
import type { Access } from '@/Effect/Access'
import type { Chain } from '@/Effect/Chain'
import type { Drain } from '@/Effect/Drain'
import type { Fork } from '@/Effect/Fork'
import type { FromAsync } from '@/Effect/FromAsync'
import type { FromExit } from '@/Effect/FromExit'
import type { FromLazy } from '@/Effect/FromIO'
import type { FromPromise } from '@/Effect/FromPromise'
import type { FromTuple } from '@/Effect/FromTuple'
import type { GetContext } from '@/Effect/GetContext'
import type { GetScope } from '@/Effect/GetScope'
import type { Join } from '@/Effect/Join'
import type { Lazy } from '@/Effect/Lazy'
import type { Match } from '@/Effect/Match'
import type { Provide } from '@/Effect/Provide'
import type { Race } from '@/Effect/Race'
import type { Refine } from '@/Effect/Refine'
import type { Result } from '@/Effect/Result'
import type { Suspend } from '@/Effect/Suspend'
import type { Trace } from '@/Effect/Trace'
import type { TracingStatus } from '@/Effect/TracingStatus'
import type { Fx } from '@/Fx'

export type Instruction<R, E> =
  | Access<R, R, E, any>
  | Chain<R, E, any, R, E, any>
  | Drain<R, E, any>
  | Fork<R, E, any>
  | FromAsync<any>
  | FromExit<E, any>
  | FromLazy<any>
  | FromPromise<any>
  | FromTuple<ReadonlyArray<Fx<R, E, any>>>
  | GetContext<E>
  | GetScope<E, any>
  | Join<E, any>
  | Lazy<R, E, any>
  | Match<R, E, any, R, E, any, R, E, any>
  | Provide<R, E, any>
  | Race<ReadonlyArray<Fx<R, E, any>>>
  | Refine<R, E, any, E>
  | Result<R, E, any>
  | Suspend
  | Trace
  | TracingStatus<R, E, any>
  | WithinContext<R, E, any>

export type FindInstruction<Type extends Instruction<R, E>['type'], R, E> = {
  Access: Access<R, R, E, any>
  Chain: Chain<R, E, any, R, E, any>
  Drain: Drain<R, E, any>
  Fork: Fork<R, E, any>
  FromAsync: FromAsync<any>
  FromExit: FromExit<E, any>
  FromIO: FromLazy<any>
  FromPromise: FromPromise<any>
  FromTuple: FromTuple<readonly Fx<R, E, any>[]>
  GetContext: GetContext<E>
  GetScope: GetScope<E, any>
  Join: Join<E, any>
  Lazy: Lazy<R, E, any>
  Match: Match<R, E, any, R, E, any, R, E, any>
  Provide: Provide<R, E, any>
  Race: Race<readonly Fx<R, E, any>[]>
  Refine: Refine<R, E, any, E>
  Result: Result<R, E, any>
  Suspend: Suspend
  Trace: Trace
  TracingStatus: TracingStatus<R, E, any>
  WithinContext: WithinContext<R, E, any>
}[Type]

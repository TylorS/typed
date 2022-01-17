import { Access } from '@/Effect/Access'
import { Chain } from '@/Effect/Chain'
import { Effect } from '@/Effect/Effect'
import { Fork } from '@/Effect/Fork'
import { FromAsync } from '@/Effect/FromAsync'
import { FromExit } from '@/Effect/FromExit'
import { FromIO } from '@/Effect/FromIO'
import { FromPromise } from '@/Effect/FromPromise'
import { FromTuple } from '@/Effect/FromTuple'
import { GetContext } from '@/Effect/GetContext'
import { GetScope } from '@/Effect/GetScope'
import { Join } from '@/Effect/Join'
import { Lazy } from '@/Effect/Lazy'
import { Match } from '@/Effect/Match'
import { Provide } from '@/Effect/Provide'
import { Race } from '@/Effect/Race'
import { Refine } from '@/Effect/Refine'
import { Result } from '@/Effect/Result'
import { Suspend } from '@/Effect/Suspend'
import { Trace } from '@/Effect/Trace'
import { TracingStatus } from '@/Effect/TracingStatus'

export type Instruction<R, E> =
  | Access<R, R, E, any>
  | Chain<R, E, any, R, E, any>
  | Fork<R, E, any>
  | FromAsync<any>
  | FromExit<E, any>
  | FromIO<any>
  | FromPromise<any>
  | FromTuple<readonly Effect<R, E, any>[]>
  | GetContext<E>
  | GetScope<E, any>
  | Join<E, any>
  | Lazy<R, E, any>
  | Match<R, E, any, R, E, any, R, E, any>
  | Provide<R, E, any>
  | Race<readonly Effect<R, E, any>[]>
  | Refine<R, E, any, E>
  | Result<R, E, any>
  | Suspend
  | Trace
  | TracingStatus<R, E, any>

export type FindInstruction<Type extends Instruction<R, E>['type'], R, E> = {
  Access: Access<R, R, E, any>
  Chain: Chain<R, E, any, R, E, any>
  Fork: Fork<R, E, any>
  FromAsync: FromAsync<any>
  FromExit: FromExit<E, any>
  FromIO: FromIO<any>
  FromPromise: FromPromise<any>
  FromTuple: FromTuple<readonly Effect<R, E, any>[]>
  GetContext: GetContext<E>
  GetScope: GetScope<E, any>
  Join: Join<E, any>
  Lazy: Lazy<R, E, any>
  Match: Match<R, E, any, R, E, any, R, E, any>
  Provide: Provide<R, E, any>
  Race: Race<readonly Effect<R, E, any>[]>
  Refine: Refine<R, E, any, E>
  Result: Result<R, E, any>
  Suspend: Suspend
  Trace: Trace
  TracingStatus: TracingStatus<R, E, any>
}[Type]

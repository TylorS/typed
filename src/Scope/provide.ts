import { LocalScope } from './Scope'

export function provide<R2>(requirements: R2) {
  return <R, A>(scope: LocalScope<R, A>): LocalScope<R2, A> => ({ ...scope, requirements })
}

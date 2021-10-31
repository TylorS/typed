import { FinalizerKey, Scope } from './Scope'

export function cancel(key: FinalizerKey) {
  return <R, A>(scope: Scope<R, A>): boolean => {
    if (scope.type === 'Global') {
      return false
    }

    return scope.finalizers.delete(key)
  }
}

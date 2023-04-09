import { Fx } from '@typed/fx/Fx'

export function succeed<A>(value: A): Fx<never, never, A> {
  return Fx((sink) => sink.event(value))
}

export const unit = succeed<void>(undefined)

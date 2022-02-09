import { Time } from '@/Clock'
import { pipe } from '@/Prelude/function'
import { match, Option } from '@/Prelude/Option'

export const accountForTimeDrift = (
  previous: Option<Time>,
  current: Time,
  period: number,
): Time => {
  return pipe(
    previous,
    match(
      () => current,
      (p) => Time(p + period),
    ),
  )
}

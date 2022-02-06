import { Time } from '@/Clock'
import { pipe } from '@/function'
import { match, Option } from '@/Option'

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

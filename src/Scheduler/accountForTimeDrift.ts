import { pipe } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'

import { Time } from '@/Clock'

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

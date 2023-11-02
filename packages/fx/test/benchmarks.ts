import * as most from "@most/core"
import type { Stream } from "@most/types"
import * as Fx from "@typed/fx/Fx"
import { comparison } from "@typed/fx/test/helpers/benchmark"
import { pipe } from "effect/Function"
import * as rxjs from "rxjs"

const isEven = (n: number) => n % 2 === 0
const addOne = (n: number) => n + 1

const mostFromArray = <A>(array: Array<A>): Stream<A> =>
  most.newStream((sink, scheduler) => {
    const time = scheduler.currentTime()
    for (let i = 0; i < array.length; ++i) {
      sink.event(time, array[i])
    }
    sink.end(time)

    return { dispose: () => {} }
  })

const filterMapReduce = (array: Array<number>) => {
  comparison(`Filter -> Map -> Reduce (${array.length} items)`, {
    rxjs: () => rxjs.from(array).pipe(rxjs.filter(isEven), rxjs.map(addOne), rxjs.reduce((a, b) => a + b, 0)),
    most: () => pipe(mostFromArray(array), most.filter(isEven), most.map(addOne), most.scan((a, b) => a + b, 0)),
    fx: () => Fx.fromIterable(array).pipe(Fx.filter(isEven), Fx.map(addOne), Fx.reduce(0, (a, b) => a + b)),
    array: () => array.filter(isEven).map(addOne).reduce((a, b) => a + b, 0)
  }, {
    timeout: 10_000
  })
}

const arrayTo = (length: number) => Array.from({ length }, (_, i) => i)

describe.skip("Benchmarks", () => {
  filterMapReduce(arrayTo(1000))
  filterMapReduce(arrayTo(10000))
  filterMapReduce(arrayTo(100000))
})

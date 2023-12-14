import * as most from "@most/core"
import type { Stream } from "@most/types"
import * as Fx from "@typed/fx/Fx"
import { comparison } from "@typed/fx/test/helpers/benchmark"
import * as v3 from "@typed/fx/v3/internal/core"
import { pipe } from "effect/Function"
import * as rxjs from "rxjs"

const isEven = (n: number) => n % 2 === 0
const addOne = (n: number) => n + 1
const add = (a: number, b: number) => a + b

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
    rxjs: () => rxjs.from(array).pipe(rxjs.filter(isEven), rxjs.map(addOne), rxjs.reduce(add, 0)),
    most: () => pipe(mostFromArray(array), most.filter(isEven), most.map(addOne), most.scan(add, 0)),
    fx: () => Fx.fromIterable(array).pipe(Fx.filter(isEven), Fx.map(addOne), Fx.reduce(0, add)),
    array: () => array.filter(isEven).map(addOne).reduce(add, 0),
    v3: () => v3.reduce(v3.map(v3.filter(v3.fromArray(array), isEven), addOne), 0, add)
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

import { benchmark } from "@/test/benchmark"
import * as most from "@most/core"
import type { Stream } from "@most/types"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { comparison } from "@typed/fx/test/helpers/benchmark"
import * as v3 from "@typed/fx/v3/Fx"
import * as v3Ref from "@typed/fx/v3/RefSubject"
import { Effect } from "effect"
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

const arr1000 = arrayTo(1000)
const arr10000 = arrayTo(10000)
const arr100000 = arrayTo(100000)

describe.skip("Stream Benchmarks", () => {
  filterMapReduce(arr1000)
  filterMapReduce(arr10000)
  filterMapReduce(arr100000)
})

const v3FromArrayNoFusion = (amount: number) =>
  v3.make<number>((sink) => Effect.all(arrayTo(amount).map((x) => sink.onSuccess(x), { discard: true })))

describe("Fx v2 vs v3 Benchmarks", () => {
  benchmark(`Fx`)
    .comparison(`get/set/delete`, [
      {
        name: `v2`,
        effect: Effect.scoped(Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(1))
          for (let i = 0; i < 10; ++i) {
            yield* _(ref.set(i))
            yield* _(ref)
          }
          yield* _(ref.delete)
        }))
      },
      {
        name: "v3",
        effect: Effect.scoped(Effect.gen(function*(_) {
          const ref = yield* _(v3Ref.of(1))
          for (let i = 0; i < 10; ++i) {
            yield* _(v3Ref.set(ref, i))
            yield* _(ref)
          }
          yield* _(v3Ref.delete(ref))
        }))
      }
    ])
    .comparison(`keyed`, [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(Fx.keyed(
          Fx.merge([
            Fx.succeed([1, 2, 3]),
            Fx.at([3, 2, 1], 5),
            Fx.at([4, 5, 6, 1], 10)
          ]),
          (x) => x,
          (x) => x
        ))
      },
      {
        name: `v3`,
        effect: Effect.scoped(v3.toReadonlyArray(v3.keyed(
          v3.mergeAll([
            v3.succeed([1, 2, 3]),
            v3.at([3, 2, 1], 5),
            v3.at([4, 5, 6, 1], 10)
          ]),
          {
            onValue: (x) => x,
            getKey: (x) => x
          }
        )))
      }
    ])
    .comparison("switchMap", [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(Fx.switchMap(Fx.succeed(1), (x) => Fx.succeed(x + 1)))
      },
      {
        name: "v3",
        effect: Effect.scoped(v3.toReadonlyArray(v3.switchMap(v3.succeed(1), (x) => v3.succeed(x + 1))))
      }
    ])
    .comparison("switchMap array (100)", [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(
          Fx.switchMap(
            Fx.fromIterable(arrayTo(100)),
            (x) => Fx.succeed(x + 1)
          )
        )
      },
      {
        name: "v3",
        effect: Effect.scoped(
          v3.toReadonlyArray(v3.switchMap(
            v3.fromArray(arrayTo(100)),
            (x) => v3.succeed(x + 1)
          ))
        )
      }
    ])
    .comparison("switchMap array (100) :: no fusion", [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(
          Fx.switchMap(
            Fx.fromIterable(arrayTo(100)),
            (x) => Fx.succeed(x + 1)
          )
        )
      },
      {
        name: "v3",
        effect: Effect.scoped(
          v3.toReadonlyArray(v3.switchMap(
            v3FromArrayNoFusion(100),
            (x) => v3.succeed(x + 1)
          ))
        )
      }
    ])
    .comparison("exhaustMap array (100) :: no fusion", [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(
          Fx.exhaustMap(
            Fx.fromIterable(arrayTo(100)),
            (x) => Fx.succeed(x + 1)
          )
        )
      },
      {
        name: "v3",
        effect: Effect.scoped(
          v3.toReadonlyArray(v3.exhaustMap(
            v3FromArrayNoFusion(100),
            (x) => v3.succeed(x + 1)
          ))
        )
      }
    ])
    .comparison("exhaustMapLatest array (100) :: no fusion", [
      {
        name: "v2",
        effect: Fx.toReadonlyArray(
          Fx.exhaustMapLatest(
            Fx.fromIterable(arrayTo(100)),
            (x) => Fx.succeed(x + 1)
          )
        )
      },
      {
        name: "v3",
        effect: Effect.scoped(
          v3.toReadonlyArray(v3.exhaustMapLatest(
            v3FromArrayNoFusion(100),
            (x) => v3.succeed(x + 1)
          ))
        )
      }
    ])
    .comparison(`array (1000) -> filter (isEven) -> map (addOne) -> reduce (sum)`, [
      {
        name: "v2",
        effect: Fx.reduce(
          Fx.map(
            Fx.filter(Fx.fromIterable(arr1000), isEven),
            addOne
          ),
          0,
          add
        )
      },
      {
        name: "v3",
        effect: v3.reduce(
          v3.map(
            v3.filter(v3.fromArray(arr1000), isEven),
            addOne
          ),
          0,
          add
        )
      }
    ])
    .comparison(`array (10000) -> filter (isEven) -> map (addOne) -> reduce (sum)`, [
      {
        name: "v2",
        effect: Fx.reduce(
          Fx.map(
            Fx.filter(Fx.fromIterable(arr10000), isEven),
            addOne
          ),
          0,
          add
        )
      },
      {
        name: "v3",
        effect: v3.reduce(
          v3.map(
            v3.filter(v3.fromArray(arr10000), isEven),
            addOne
          ),
          0,
          add
        )
      },
      {
        name: "array",
        effect: Effect.sync(() => arr10000.filter(isEven).map(addOne).reduce(add, 0))
      }
    ])
    .run({ iterations: 100, timeout: 10_000 })
}, {
  timeout: 1000 * 60 * 2
})

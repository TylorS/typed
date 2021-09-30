import { deepStrictEqual } from 'assert'
import { left, right } from 'fp-ts/Either'
import { describe } from 'mocha'

import { Uncancelable } from '@/Cancelable'
import { interrupted, unexpected } from '@/Cause'

import * as Fx from '.'
import { DefaultRuntime } from './DefaultRuntime'
import { DefaultScope } from './DefaultScope'

describe(__filename, () => {
  describe('Runtime', () => {
    describe('Instructions', () => {
      describe(Fx.Success.name, () => {
        it('returns the value', () => {
          const value = 1
          const fx = Fx.fromInstruction(new Fx.Success(value))
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (exit) => {
            deepStrictEqual(exit, right(value))
          })
        })
      })

      describe(Fx.Access.name, () => {
        it('allows accessing the environment', () => {
          const a = 42
          const fx = Fx.fromInstruction(
            new Fx.Access((r: { a: number }) => Fx.fromInstruction(new Fx.Success(r.a))),
          )
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, { a }, (exit) => {
            deepStrictEqual(exit, right(a))
          })
        })
      })

      describe(Fx.FromExit.name, () => {
        it('allows exiting early', () => {
          const exit = left(unexpected(42))
          const fx = Fx.fromInstruction(new Fx.FromExit(exit))
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            deepStrictEqual(actual, exit)
          })
        })
      })

      describe(Fx.FromIO.name, () => {
        it('executes an IO', () => {
          const value = 42

          const fx = Fx.fromInstruction(new Fx.FromIO(() => value))
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            deepStrictEqual(actual, right(value))
          })
        })
      })

      describe(Fx.FromPromise.name, () => {
        it('awaits a Promise', (done) => {
          const value = Math.random()

          const fx = Fx.fromInstruction(new Fx.FromPromise(async () => value))
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            deepStrictEqual(actual, right(value))
            done()
          })
        })

        it('supports primitive cancelation', (done) => {
          const value = Math.random()

          const fx = Fx.fromInstruction(
            new Fx.FromPromise(
              async () => await new Promise((resolve) => setTimeout(resolve, 1000, value)),
            ),
          )
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          const { cancel } = runtime.runMain(fx, scope, {}, (actual) => {
            try {
              deepStrictEqual(actual, left(interrupted))
              done()
            } catch (e) {
              done(e)
            }
          })

          cancel()?.catch(done)
        })
      })

      describe(Fx.FromAsync.name, () => {
        it('await Async value', (done) => {
          const value = Math.random()
          // eslint-disable-next-line no-sequences
          const fx = Fx.fromInstruction(new Fx.FromAsync((cb) => (cb(value), Uncancelable)))

          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            try {
              deepStrictEqual(actual, right(value))
              done()
            } catch (e) {
              done(e)
            }
          })
        })

        it('supports cancelation', (done) => {
          const value = Math.random()
          const fx = Fx.fromInstruction(
            new Fx.FromAsync((cb) => {
              const id = setTimeout(cb, 1000, value)

              return { cancel: () => clearTimeout(id) }
            }),
          )
          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          const { cancel } = runtime.runMain(fx, scope, {}, (actual) => {
            try {
              deepStrictEqual(actual, left(interrupted))
              done()
            } catch (e) {
              done(e)
            }
          })

          cancel()?.catch(done)
        })
      })
    })

    describe(Fx.FlatMap.name, () => {
      it('allows handling next value', (done) => {
        const fx = Fx.of(1)
        const onRight = (n: number): Fx.Fx<unknown, number> => Fx.of(n + 1)

        const fold = Fx.fromInstruction(new Fx.FlatMap(fx, onRight))

        const runtime = new DefaultRuntime()
        const scope = new DefaultScope()

        const { cancel } = runtime.runMain(fold, scope, {}, (actual) => {
          deepStrictEqual(actual, right(2))
          done()
        })

        cancel()?.catch(done)
      })
    })

    describe(Fx.Parallel.name, () => {
      describe('given multiple Fxs', () => {
        it('runs them all in parallel', (done) => {
          const fx = Fx.zip(Fx.of(1), Fx.of(2))

          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            deepStrictEqual(actual, right([1, 2]))
            done()
          })
        })
      })
    })

    describe(Fx.Race.name, () => {
      describe('given multiple Fxs', () => {
        it('returns the winning values', (done) => {
          const fx = Fx.race(
            Fx.of(1),
            Fx.fromPromise<number>(
              async () => await new Promise((resolve) => setTimeout(resolve, 1000, 2)),
            ),
          )

          const runtime = new DefaultRuntime()
          const scope = new DefaultScope()

          runtime.runMain(fx, scope, {}, (actual) => {
            deepStrictEqual(actual, right(1))
            done()
          })
        })
      })
    })
  })
})

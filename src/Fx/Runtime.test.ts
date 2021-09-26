import { deepStrictEqual } from 'assert'
import { left, right } from 'fp-ts/Either'
import { describe } from 'mocha'

import { Uncancelable } from '@/Cancelable'
import { expected, interrupted } from '@/Cause'

import * as Fx from './Fx'
import { Runtime } from './Runtime'
import { Scope } from './Scope'

describe(__filename, () => {
  describe('Runtime', () => {
    describe('Instructions', () => {
      describe(Fx.Success.name, () => {
        it('returns the value', () => {
          const value = 1
          const fx = Fx.fromInstruction(new Fx.Success(value))
          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (exit) => {
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
          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, { a }, (exit) => {
            deepStrictEqual(exit, right(a))
          })
        })
      })

      describe(Fx.FromExit.name, () => {
        it('allows exiting early', () => {
          const exit = left(expected(42))
          const fx = Fx.fromInstruction(new Fx.FromExit(exit))
          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
            deepStrictEqual(actual, expected)
          })
        })
      })

      describe(Fx.FromIO.name, () => {
        it('executes an IO', () => {
          const value = 42

          const fx = Fx.fromInstruction(new Fx.FromIO(() => value))
          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
            deepStrictEqual(actual, right(value))
          })
        })
      })

      describe(Fx.FromPromise.name, () => {
        it('awaits a Promise', (done) => {
          const value = Math.random()

          const fx = Fx.fromInstruction(new Fx.FromPromise(async () => value))
          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
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
          const runtime = new Runtime(fx)
          const scope = new Scope()

          const { cancel } = runtime.runMain(scope, {}, (actual) => {
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

          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
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
          const runtime = new Runtime(fx)
          const scope = new Scope()

          const { cancel } = runtime.runMain(scope, {}, (actual) => {
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

    describe(Fx.Fold.name, () => {
      it('allows handling expected errors', (done) => {
        const fx = Fx.fromInstruction(
          new Fx.FromExit<Error, string>(left(expected(new Error('foo')))),
        )
        const onLeft = (e: Error): Fx.Fx<unknown, Error, string> =>
          Fx.fromInstruction(new Fx.Success(e.message))
        const onRight = (): Fx.Fx<unknown, Error, string> =>
          Fx.fromInstruction(new Fx.Success('unexpected'))

        const fold = Fx.fromInstruction(new Fx.Fold(fx, onLeft, onRight))

        const runtime = new Runtime(fold)
        const scope = new Scope()

        const { cancel } = runtime.runMain(scope, {}, (actual) => {
          deepStrictEqual(actual, right('foo'))
          done()
        })

        cancel()?.catch(done)
      })

      it('allows handling next value', (done) => {
        const fx = Fx.fromInstruction<unknown, Error, string>(new Fx.Success<string>('initial'))
        const onLeft = (e: Error): Fx.Fx<unknown, Error, string> =>
          Fx.fromInstruction(new Fx.Success(e.message))
        const onRight = (): Fx.Fx<unknown, Error, string> =>
          Fx.fromInstruction(new Fx.Success('expected'))

        const fold = Fx.fromInstruction(new Fx.Fold(fx, onLeft, onRight))

        const runtime = new Runtime(fold)
        const scope = new Scope()

        const { cancel } = runtime.runMain(scope, {}, (actual) => {
          deepStrictEqual(actual, right('expected'))
          done()
        })

        cancel()?.catch(done)
      })
    })

    describe(Fx.FlatMap.name, () => {
      it('allows handling next value', (done) => {
        const fx = Fx.fromInstruction(new Fx.Success<number>(1))
        const onRight = (n: number): Fx.Fx<unknown, Error, number> =>
          Fx.fromInstruction(new Fx.Success(n + 1))

        const fold = Fx.fromInstruction(new Fx.FlatMap(fx, onRight))

        const runtime = new Runtime(fold)
        const scope = new Scope()

        const { cancel } = runtime.runMain(scope, {}, (actual) => {
          deepStrictEqual(actual, right(2))
          done()
        })

        cancel()?.catch(done)
      })
    })

    describe(Fx.Parallel.name, () => {
      describe('given multiple Fxs', () => {
        it('runs them all in parallel', (done) => {
          const fx = Fx.fromInstruction<unknown, any, [number, number]>(
            new Fx.Parallel(
              Fx.fromInstruction<unknown, any, number>(new Fx.Success<number>(1)),
              Fx.fromInstruction<unknown, any, number>(new Fx.Success<number>(2)),
            ),
          )

          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
            deepStrictEqual(actual, right([1, 2]))
            done()
          })
        })
      })
    })

    describe(Fx.Race.name, () => {
      describe('given multiple Fxs', () => {
        it('returns the winning values', (done) => {
          const fx = Fx.fromInstruction<unknown, any, number>(
            new Fx.Race(
              Fx.fromInstruction(new Fx.Success<number>(1)),
              Fx.fromInstruction(
                new Fx.FromPromise<number>(
                  async () => await new Promise((resolve) => setTimeout(resolve, 1000, 2)),
                ),
              ),
            ),
          )

          const runtime = new Runtime(fx)
          const scope = new Scope()

          runtime.runMain(scope, {}, (actual) => {
            deepStrictEqual(actual, right(1))
            done()
          })
        })
      })
    })
  })
})

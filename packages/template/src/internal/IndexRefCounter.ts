import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

export type IndexRefCounter = {
  release: (index: number) => void;
  expect: (count: number) => boolean;
  wait: Effect.Effect<void>;
};

/**
 * @internal
 */
export const makeRefCounter: Effect.Effect<IndexRefCounter> = Effect.map(
  Deferred.make<void>(),
  (deferred) => {
    let expected: Option.Option<number> = Option.none<number>();
    const indexes = new Set<number>();

    function isDone() {
      if (Option.isSome(expected)) {
        return indexes.size === expected.value;
      } else {
        return false;
      }
    }

    function release(index: number) {
      indexes.add(index);
      if (isDone()) {
        return Deferred.doneUnsafe(deferred, Effect.void);
      } else {
        return false;
      }
    }

    function expect(count: number) {
      expected = Option.some(count);
      if (isDone()) {
        Deferred.doneUnsafe(deferred, Effect.void);
        return false;
      } else {
        return true;
      }
    }

    return {
      release,
      expect,
      wait: Deferred.await(deferred),
    };
  },
);

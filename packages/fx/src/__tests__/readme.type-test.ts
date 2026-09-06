import { Effect } from "effect";
import { Fx, RefArray, Sink } from "@typed/fx";

const example = Fx.fromIterable([1, 2, 3]).pipe(
  Fx.filter((n) => n % 2 === 0),
  Fx.map((n) => n * 2),
  Fx.observe((n) => Effect.log(`emitted: ${n}`)),
);

Effect.runPromise(example);

const source = Fx.fromIterable([1, 2, 3]);

source.pipe(
  Fx.takeUntil((n) => n === 3),
  Fx.tap((n) => Effect.log(n)),
);

source.pipe(
  Fx.flatMapEffect((n) => Effect.succeed(n * 2)),
  Fx.flatMapConcurrently((n) => Fx.succeed(n * 2), 2),
  Fx.flatMapConcurrentlyEffect((n) => Effect.succeed(n * 2), 2),
  Fx.withSpan("README example"),
);

Fx.keyed(Fx.succeed([{ id: 1 }]), {
  getKey: (item) => item.id,
  onValue: (item) => item,
});

Fx.if(Fx.succeed(true), {
  onTrue: Fx.succeed("yes"),
  onFalse: Fx.succeed("no"),
});

Fx.when(Fx.succeed(true), {
  onTrue: "yes",
  onFalse: "no",
});

const dropAfterProgram = Sink.dropAfter(
  Sink.make(
    () => Effect.void,
    (_value: number) => Effect.void,
  ),
  (value) => value >= 3,
  (sink) => sink.onSuccess(3),
);

Effect.runPromise(dropAfterProgram);

const refArrayProgram = Effect.gen(function* () {
  const values = yield* RefArray.make<number, never, never>([1, 2, 3]);
  yield* RefArray.append(values, 4);
  yield* RefArray.insertAt(values, 0, 0);
  yield* RefArray.replaceAt(values, 1, 10);
  yield* RefArray.drop(values, 1);
  yield* RefArray.filterValues(values, (value) => value > 1);
});

Effect.runPromise(Effect.scoped(refArrayProgram));

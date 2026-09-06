import { Cause, Data, Effect, Ref } from "effect";
import { Sink } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";
class ConnectionLost extends Data.TaggedError("ConnectionLost") {
}
const program = Effect.scoped(Effect.gen(function* () {
    const events = yield* Subject.make();
    const values = yield* Ref.make([]);
    const failures = yield* Ref.make(0);
    const sink = Sink.make(() => Ref.update(failures, (count) => count + 1), (value) => Ref.update(values, (all) => [...all, value]));
    yield* Effect.forkScoped(events.run(sink));
    while ((yield* events.subscriberCount) < 1)
        yield* Effect.yieldNow;
    yield* events.onFailure(Cause.fail(new ConnectionLost()));
    yield* events.onSuccess("reconnected");
    return { failures: yield* Ref.get(failures), values: yield* Ref.get(values) };
}));
export const __guideTestResult = await (Effect.runPromise(program));

import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";
const selections = Fx.fromIterable(["typed", "effect"]);
const selectedWorkspace = Fx.first(selections).pipe(Effect.flatMap(Option.match({
    onNone: () => Effect.fail("no workspace selected"),
    onSome: Effect.succeed,
})));
export const __guideTestResult = await (Effect.runPromise(selectedWorkspace));

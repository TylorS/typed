import { Effect } from "effect";
import { Fx } from "@typed/fx";
const ids = Fx.fromIterable(new Set(["ada", "grace", "barbara"]));
const program = Fx.collectAll(ids);
const result = await Effect.runPromise(program);
export const __guideTestResult = await (result);

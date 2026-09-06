import type { Fx as FxType } from "../Fx.js";
import * as Fx from "../Fx.js";
import type { Assert, Equal } from "./assert.type-test.js";

const source = Fx.sync(() => ({ id: 1 as const }));

type _SyncType = Assert<Equal<typeof source, FxType<{ id: 1 }>>>;

// @ts-expect-error sync accepts a synchronous value factory, not an Effect.
Fx.sync(42);

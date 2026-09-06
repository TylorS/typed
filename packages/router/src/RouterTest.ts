import { IdsTest } from "@typed/id/IdsTest";
import {
  initialMemory,
  type InitialMemoryOptions,
  memory,
  type MemoryOptions,
} from "@typed/navigation/memory";
import type * as Cause from "effect/Cause";
import * as Layer from "effect/Layer";
import { CurrentRoute } from "./CurrentRoute.js";
import type { Router } from "./Router.js";
import type { NavigationError } from "@typed/navigation/model";

/**
 * Builds a deterministic in-memory Router Layer for tests.
 *
 * @remarks
 * This test-only entry point keeps deterministic ID and Effect TestClock code out of production
 * imports of `Router`. The Layer Scope owns memory history and CurrentRoute.
 *
 * @example
 * ```ts
 * import { TestRouter } from "@typed/router/RouterTest"
 * const RouterTest = TestRouter({ url: "/" })
 * ```
 *
 * @since 1.0.0
 * @category Test history
 */
export const TestRouter = (
  options: (MemoryOptions | InitialMemoryOptions) & {},
): Layer.Layer<Router, Cause.IllegalArgumentError | NavigationError> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge("url" in options ? initialMemory(options) : memory(options)),
    Layer.provideMerge(IdsTest()),
  );

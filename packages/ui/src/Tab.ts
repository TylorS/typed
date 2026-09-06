/**
 * Compatibility entrypoint for the Tabs API.
 *
 * @remarks
 * Importing from `@typed/ui/Tab` exposes the same declarations as `@typed/ui/Tabs`; it does not
 * create a second state model or renderer. Prefer whichever public specifier matches the surrounding
 * codebase, and use one shared Tabs state across List, Tab, and Panel.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Tab from "@typed/ui/Tab";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Tab.makeState({ selectedId: "overview" });
 *     return yield* state;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
export * from "./Tabs.js";

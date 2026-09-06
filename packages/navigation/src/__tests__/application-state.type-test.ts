import {
  Navigation,
  type NavigationInfoOptions,
  type NavigationNavigateOptions,
} from "@typed/navigation";
import type * as Effect from "effect/Effect";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

interface AppState {
  readonly userId: string;
}

type DestinationState<S> = Omit<import("@typed/navigation").Destination, "state"> & {
  readonly state: S;
};

const appState: AppState = { userId: "user-1" };
const navigateWithLiteral = Navigation.navigate("account", { state: appState });
const reloadWithLiteral = Navigation.reload({ state: appState });
const updateWithLiteral = Navigation.updateCurrentEntry({ state: appState });

type _NavigateWithLiteral = Assert<
  Equal<
    typeof navigateWithLiteral,
    Effect.Effect<DestinationState<AppState>, import("@typed/navigation").NavigationError, Navigation>
  >
>;

type _ReloadWithLiteral = Assert<
  Equal<
    typeof reloadWithLiteral,
    Effect.Effect<DestinationState<AppState>, import("@typed/navigation").NavigationError, Navigation>
  >
>;

type _UpdateWithLiteral = Assert<
  Equal<
    typeof updateWithLiteral,
    Effect.Effect<DestinationState<AppState>, import("@typed/navigation").NavigationError, Navigation>
  >
>;

type _InfoOptions = Assert<
  Equal<Parameters<typeof Navigation.back>[0], NavigationInfoOptions | undefined>
>;

type _NavigateOptions = Assert<
  Equal<
    NavigationNavigateOptions,
    {
      readonly state?: unknown;
      readonly info?: unknown;
      readonly history?: "auto" | "push" | "replace";
    }
  >
>;

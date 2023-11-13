import { fromNavigation } from "@typed/navigation/internal/fromNavigation"
import { Navigation } from "@typed/navigation/Navigation"
import type { Layer } from "effect"

export const native = (
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  navigation: import("@virtualstate/navigation").Navigation
): Layer.Layer<never, never, Navigation> => Navigation.scoped(fromNavigation(navigation))

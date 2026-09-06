import type * as Context from "effect/Context";
import { Provider } from "../Runtime.js";
import {
  createElement,
  startTransition,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export interface RootViewProps {
  readonly element: ReactNode;
  readonly context: Context.Context<never>;
  readonly ready?: (update: (element: ReactNode) => void) => void;
}

/** Shares component ancestry between SSR and hydration, including React useId paths. */
export function RootView({ element, ready, context }: RootViewProps): ReactElement {
  const [current, setCurrent] = useState(element);

  useEffect(() => {
    ready?.((next) => startTransition(() => setCurrent(next)));
  }, [ready]);

  return createElement(Provider<never, never, never>, { context }, current);
}

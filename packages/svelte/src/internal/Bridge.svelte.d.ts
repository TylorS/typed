import type { Component } from "svelte";
import type { Readable } from "svelte/store";

type BridgeProps<Props extends Record<string, any>> = {
  readonly component: Component<Props>;
  readonly values: Readable<Props>;
};

declare const Bridge: <Props extends Record<string, any>>(
  internals: Parameters<Component<BridgeProps<Props>>>[0],
  props: BridgeProps<Props>,
) => ReturnType<Component<BridgeProps<Props>>>;

export default Bridge;

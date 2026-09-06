import type { Component } from "svelte";

declare const Placed: Component<{
  readonly onMounted: (state: { connected: boolean; width: number; focused: boolean }) => void;
}>;

export default Placed;

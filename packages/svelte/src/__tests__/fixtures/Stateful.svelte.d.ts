import type { Component } from "svelte";

declare const Stateful: Component<{
  readonly label: string;
  readonly onMounted?: () => void;
  readonly onDestroyed?: () => void;
}>;

export default Stateful;

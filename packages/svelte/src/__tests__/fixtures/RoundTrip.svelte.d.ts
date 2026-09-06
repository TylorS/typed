import type { Component } from "svelte";
import type { Renderable } from "@typed/template/Renderable";
declare const RoundTrip: Component<{
  label: Renderable<string>;
  onReady?: () => void;
}>;
export default RoundTrip;

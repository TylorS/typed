import type { Component } from "svelte";
import type { Renderable } from "@typed/template/Renderable";
import type { TypedProps } from "./Typed.js";

/** A Svelte 5 component that server-renders and hydrates a Typed view. */
declare const Typed: <const V extends Renderable.Any, ER = never>(
  internals: Parameters<Component<TypedProps<V, ER>>>[0],
  props: TypedProps<V, ER>,
) => ReturnType<Component<TypedProps<V, ER>>>;
export default Typed;

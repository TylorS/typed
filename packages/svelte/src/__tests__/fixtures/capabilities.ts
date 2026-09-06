import * as Context from "effect/Context";

export class Greeting extends Context.Service<Greeting, { readonly prefix: string }>()(
  "svelte-test/Greeting",
) {}

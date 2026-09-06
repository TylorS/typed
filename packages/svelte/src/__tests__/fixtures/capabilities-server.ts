import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { render } from "svelte/server";
import { prefetch } from "../../Reactive.js";
import CapabilitiesResource from "./CapabilitiesResource.svelte";
import { Greeting } from "./capabilities.js";

export async function renderCapabilities(label: string) {
  const runtime = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: label }));
  try {
    const source = Effect.map(Greeting, (service) => service.prefix);
    const initial = await runtime.runPromise(prefetch(source));
    return {
      html: render(CapabilitiesResource, { props: { runtime, source, initial } }).body,
    };
  } finally {
    await runtime.dispose();
  }
}

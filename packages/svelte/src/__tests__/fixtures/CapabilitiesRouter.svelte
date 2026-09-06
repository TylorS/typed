<script>
  import * as Context from "effect/Context";
  import * as Effect from "effect/Effect";
  import * as Option from "effect/Option";
  import * as Route from "@typed/router/Route";
  import { CurrentRoute } from "@typed/router/CurrentRoute";
  import { html } from "@typed/template";
  import { provideRuntime, provideServices } from "../../Runtime.js";
  import { useNavigation, useRoute, provideCurrentRoute, useCurrentRoute } from "../../Router.js";
  import Typed from "@typed/svelte/Typed.svelte";
  import { Greeting } from "./capabilities.js";

  let { runtime, overrides } = $props();
  // svelte-ignore state_referenced_locally
  provideRuntime(runtime);
  // svelte-ignore state_referenced_locally
  provideServices(overrides ?? Context.make(Greeting, { prefix: "override" }));
  provideCurrentRoute(Route.Parse("/app"));
  const nav = useNavigation();
  const { value: location } = nav.location;
  const { value: transition } = nav.transition;
  const { value: params } = useRoute(Route.Parse("/users/:id"));
  const { value: currentRoute } = useCurrentRoute();
  const view = Effect.gen(function* () {
    const greeting = yield* Greeting;
    const owner = yield* CurrentRoute;
    return html`<span data-context>${greeting.prefix}:${owner.route.path}:${owner.parent?.route.path}</span>`;
  });
</script>

<p data-path>{Option.match($location, { onNone: () => "none", onSome: (d) => d.url.pathname })}</p>
<p data-route>{Option.match($currentRoute, { onNone: () => "none", onSome: (r) => r.route.path })}</p>
<p data-params>{Option.match(Option.flatten($params), { onNone: () => "unmatched", onSome: (p) => p.id })}</p>
<p data-transition>{Option.match($transition, { onNone: () => "unknown", onSome: (t) => Option.isSome(t) ? "pending" : "idle" })}</p>
<button data-next onclick={() => nav.navigate("/app/users/2")}>next</button>
<button data-away onclick={() => nav.navigate("/elsewhere")}>away</button>
<button data-back onclick={() => nav.back()}>back</button>
<Typed {view} />

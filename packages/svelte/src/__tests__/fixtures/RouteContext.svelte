<script>
  import * as Option from "effect/Option";
  import * as Route from "@typed/router/Route";
  import { provideRuntime } from "../../Runtime.js";
  import { useRoute, provideCurrentRoute } from "../../Router.js";

  let { runtime, currentRoute } = $props();
  // svelte-ignore state_referenced_locally
  provideRuntime(runtime);
  provideCurrentRoute(Route.Parse("/app"));
  // svelte-ignore state_referenced_locally
  const { data, value, error } = useRoute(Route.Parse("/users/:id"), { currentRoute });
</script>

<p data-state>{$data._tag}</p>
<p data-value>{Option.match(Option.flatten($value), { onNone: () => "none", onSome: (params) => params.id })}</p>
<p data-error>{Option.match($error, { onNone: () => "none", onSome: (error) => error._tag })}</p>

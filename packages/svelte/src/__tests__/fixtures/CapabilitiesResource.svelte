<script>
  import * as AD from "@typed/async-data";
  import * as Option from "effect/Option";
  import { provideRuntime } from "../../Runtime.js";
  import { useSource, useService, useAsyncData } from "../../Reactive.js";
  import { Greeting } from "./capabilities.js";

  let { runtime, source, initial = AD.success("server"), asyncData = false } = $props();
  // These props are stable native stores; their values change through subscribe.
  // svelte-ignore state_referenced_locally
  provideRuntime(runtime);
  // svelte-ignore state_referenced_locally
  const state = asyncData ? useAsyncData(source, { initial }) : useSource(source, { initial });
  const { data, latest, pending, refreshing } = state;
  const { value: service } = useService(Greeting, { initial: AD.success({ prefix: "server-service" }) });
</script>

<p data-state>{$data._tag}</p>
<p data-value>{Option.getOrElse(AD.getSuccess($data), () => "empty")}</p>
<p data-latest>{Option.getOrElse($latest, () => "empty")}</p>
<p data-service>{Option.match($service, { onNone: () => "none", onSome: (s) => s.prefix })}</p>
<p data-pending>{String($pending)}</p>
<p data-refreshing>{String($refreshing)}</p>
<button data-refresh onclick={state.refresh}>refresh</button>
<button data-cancel onclick={state.cancel}>cancel</button>

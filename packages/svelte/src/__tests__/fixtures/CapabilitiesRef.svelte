<script>
  import { provideRuntime } from "../../Runtime.js";
  import { useRefSubject } from "../../Reactive.js";
  import * as Option from "effect/Option";
  let { runtime, ref, capture = () => {} } = $props();
  // svelte-ignore state_referenced_locally
  provideRuntime(runtime);
  // svelte-ignore state_referenced_locally
  const value = useRefSubject(ref, -1);
  const { data, error } = value.state;
  // svelte-ignore state_referenced_locally
  capture(value);
</script>
<p data-ref>{$value}</p>
<p data-ref-state>{$data._tag}</p>
<p data-ref-error>{Option.match($error, { onNone: () => "none", onSome: String })}</p>
<button data-increment onclick={() => $value++}>increment</button>

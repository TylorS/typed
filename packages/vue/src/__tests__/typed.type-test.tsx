/** @effect-diagnostics missingEffectContext:skip-file */
import * as Effect from "effect/Effect";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import { expectTypeOf } from "vitest";
import { defineComponent, h } from "vue";
import { Typed, createTypedComponent } from "../Typed.js";
import type { VueRuntime } from "../Runtime.js";
import { useEffect } from "../Reactive.js";

const value = Effect.fail({ _tag: "ViewFailure" as const });
type ViewFailure = { _tag: "ViewFailure" };
type RuntimeFailure = { readonly _tag: "RuntimeFailure" };

const direct = (
  <Typed
    value={value}
    onError={(cause) => {
      expectTypeOf(cause).toEqualTypeOf<Cause.Cause<ViewFailure>>();
    }}
  />
);

class Service extends Context.Service<Service, string>()("typed-types/Service") {}
declare const runtime: VueRuntime<Service, RuntimeFailure>;
const Bound = createTypedComponent(runtime);
const bound = (
  <Bound
    value={value}
    onError={(cause) => {
      expectTypeOf(cause).toEqualTypeOf<Cause.Cause<ViewFailure | RuntimeFailure>>();
    }}
  />
);
h(Bound, { value });
h(Bound<typeof value>, {
  value,
  onError(cause) {
    expectTypeOf(cause).toEqualTypeOf<Cause.Cause<ViewFailure | RuntimeFailure>>();
  },
});
h(Typed<typeof value>, {
  value,
  onError(cause) {
    expectTypeOf(cause).toEqualTypeOf<Cause.Cause<ViewFailure>>();
  },
});
const serviceValue = Effect.flatMap(Service, () => value);
const withService = <Bound value={serviceValue} />;
const Empty = createTypedComponent();
// @ts-expect-error An empty runtime cannot satisfy Service.
const missingService = <Empty value={serviceValue} />;
// @ts-expect-error A handler cannot claim unrelated failures.
const wrongHandler = <Typed value={value} onError={(_cause: Cause.Cause<"unrelated">) => {}} />;
// @ts-expect-error onCause was replaced by onError.
const oldHandler = <Typed value={value} onCause={() => {}} />;
useEffect(serviceValue, {
  runtime,
  onError(cause) {
    expectTypeOf(cause).toEqualTypeOf<Cause.Cause<ViewFailure | RuntimeFailure>>();
  },
});
void [direct, bound, withService, missingService, wrongHandler, oldHandler];

defineComponent({ components: { Typed, Bound } });

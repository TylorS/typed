---
title: "Decorate a RenderTemplate target"
summary: "Capture the existing RenderTemplate service and observe its output without changing application templates."
section: "Template internals"
kind: "deep-dive"
order: 5
---

Capture the existing `RenderTemplate` service, add an output observer, and provide the decorated
service to your templates. The existing renderer continues to interpret parts and own its resources.
This example observes emitted output; it does not count DOM updates.

Read [The template compilation pipeline](/explore/template-compilation-pipeline) for the service's
place in rendering. To embed existing nodes rather than change template interpretation, use
[RenderEvent output](/explore/render-event-substrate).

## Decorate the shipped target without recursive resolution

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, RenderTemplate } from "@typed/template";

export const ObservedDomTarget = Layer.effect(
  RenderTemplate,
  Effect.gen(function* () {
    const delegate = yield* RenderTemplate;

    return (strings, values) => delegate(strings, values).pipe(
      Fx.tap(() => Effect.log("Template emitted output")),
    );
  }),
).pipe(Layer.provide(DomRenderTemplate));
```

The Layer obtains the original service while constructing its replacement, following Effect's
[explicit service provision](https://github.com/Effect-TS/effect/blob/main/migration/services.md). The returned callable
has the same `(TemplateStringsArray, values)` shape and delegates to the captured function.
Calling `html` inside that callable instead would resolve the decorator again and risk recursion.

This is a complete implementation of the service because the delegate still handles parsing,
namespace selection, normalization, event/ref policy, output, and finalization. Application templates
receive the observed target at their ordinary rendering boundary.

`Fx.tap` runs the observer before forwarding each emitted value. A slow observer delays downstream
output; a failing observer prevents that value from reaching the consumer. Its errors and required
services remain in the returned Fx type.

## Observe the operation that actually happens

A DOM template usually emits its root once and later mutates retained parts. The HTML renderer
emits ordered chunks. Counting RenderEvents therefore does not count DOM writes and is not a valid
cross-target performance comparison.

The log confirms an emission reached the observer. It does not observe source failures or confirm
that a downstream consumer received the value. Measure class changes or moved nodes at those
operations or at the browser boundary.

A decorator test should run its delegate's observable contract plus the added policy. Assert one
observation for the tested output and verify interruption still finalizes the producer. Do not
rewrite the application's templates to accommodate the observer.

For a new target rather than a decorator, follow the
[target contract checklist](/explore/template-compilation-pipeline#check-a-new-targets-contract).
The [RenderTemplate reference](/reference/modules/%40typed%2Ftemplate%2FRenderTemplate) defines
the service signature.

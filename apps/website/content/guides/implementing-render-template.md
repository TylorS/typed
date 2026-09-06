---
title: "Implement a RenderTemplate target"
summary: "Build or decorate a renderer at the public RenderTemplate boundary while keeping parsing, output ownership, and platform policy inside the target."
section: "Template internals"
kind: "deep-dive"
order: 5
---

Suppose a platform team wants to observe when templates produce output without changing every
application component. That is a renderer policy: capture the existing `RenderTemplate` service,
delegate interpretation to it, and return a service with the same contract. Replacing the whole
parser or wrapping every component is unnecessary.

Read [The template compilation pipeline](/explore/template-compilation-pipeline) first. This article
starts with a complete decorator, then identifies the additional responsibilities of a genuinely
new template target.

## Choose the smallest library boundary

| Library responsibility | Appropriate boundary |
| --- | --- |
| Static reusable markup | direct `html` template function |
| Setup returning a template Fx | `Fx.gen` |
| Isolated view scope or setup returning other renderable forms | `component` |
| Foreign nodes and their resource lifetime | scoped producer of `DomRenderEvent` |
| One element's observer/resource | scoped ref callback |
| Policy around template interpretation | delegated `RenderTemplate` service |
| Interpretation for a new target | `RenderTemplate` plus public AST/output contracts |

Do not implement a renderer merely to embed a chart. Its output already exists and can enter a
normal template range. A RenderTemplate implementation is responsible for interpreting the authored
literal and its dynamic values, not just placing an existing node.

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

`Fx.tap` participates in output delivery. A slow observer delays downstream output. Additional
observer requirements must be supplied while constructing the layer or handled under an explicit
outer contract; hiding them with `any` or detached promises defeats service inference and supervision.

## Observe the operation that actually happens

A DOM template usually emits its root once and later mutates retained parts. The HTML renderer
emits ordered chunks. Counting RenderEvents therefore does not count DOM writes and is not a valid
cross-target performance comparison.

Choose the metric before the hook. This decorator can tell you output was delivered or failed;
it cannot establish the number of changed class tokens or moved list nodes. Those require a
focused measurement at the corresponding operation or browser boundary.

A decorator test should run its delegate's observable contract plus the added policy. Assert one
observation for the tested output and verify interruption still finalizes the producer. Do not
rewrite the application's templates to accommodate the observer.

## Define a new target's semantics before implementing its parser loop

The service returns an Fx of RenderEvents while preserving the interpolation values' errors,
requirements, and running Scope. A fresh target must decide how every supported part behaves:

- Scalar and sparse fields need context-specific interpretation, not generic stringification.
- Nested output and keyed values need ordered composition and the target's lifetime policy.
- Namespace and text-only boundaries must survive compilation.
- Events, refs, and DOM properties need an explicit supported/omitted/rejected policy.
- Adoption needs an actual compatible marker/state protocol, not just matching visible markup.

For a finite HTML target, ordinary live inputs provide response values and ordered nested HTML
chunks must complete. For a live browser target, subscriptions, listeners, queued work, and acquired
resources remain owned until interruption. These are different media sharing an authoring boundary.

Document intentionally unsupported behavior. Omitting a DOM property from HTML because it lacks a
representation is a coherent target policy. Silently converting arbitrary objects to child text and
claiming full compatibility is not.

## Keep shared compilation and per-run resources separate

A parsed-literal cache can be shared by a target. An input subscription, event listener, or ref
resource belongs to one run. Reusing the former is an optimization; sharing the latter across
independent mounts would couple their lifetime and state.

Use the public `Template` AST and `HtmlChunk` contracts where applicable. Avoid importing
`@typed/template/internal/*` to obtain a private shortcut that the library then exposes as a public
assumption. If the public contracts cannot express a required target behavior, identify that gap
rather than silently depending on implementation details.

## Publish a contract you can test

Test a static literal, each supported part family, nested output order, expected Effect failure,
and interruption of a live producer. Then test target-specific promises: exact DOM identity/native
events or HTML escaping/finite completion. If hydration is advertised, test original node identity,
state decoding, and behavior after adoption—not only equal text.

Keep exported signatures inferred or accurately typed so `E` and `R` remain visible. The
[RenderTemplate reference](/reference/modules/%40typed%2Ftemplate%2FRenderTemplate) defines that
boundary; [RenderEvent output](/explore/render-event-substrate) covers the smaller adapter option.

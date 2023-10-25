import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"

const program = Fx.fromIterable([1, 2, 3]).pipe(
  Fx.withSpan("c"),
  Fx.map((n) => n * 2),
  Fx.withSpan("b"),
  Fx.map((n) => n + 1),
  Fx.withSpan("a"),
  Fx.observe((a) => Effect.log(a))
)

program.pipe(
  Effect.provide(NodeSdk.layer(() => ({
    resource: { serviceName: "example" },
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: "http://localhost:4318/v1/traces"
      })
    )
  }))),
  Effect.catchAllCause(Effect.logError),
  Effect.runFork
)

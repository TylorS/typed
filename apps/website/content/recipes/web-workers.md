---
slug: web-workers
title: Compute in a browser Worker and render with Typed
summary: Use Effect RPC and its browser worker platform for typed requests, cooperative cancellation, and scoped rendering.
---

Move CPU-heavy computation into a Worker while Typed keeps the page responsive. Effect's worker-backed RPC supplies the request IDs, schema validation, replies, and cancellation protocol. Your application supplies the computation and the template.

Install `@effect/platform-browser` at the version matching your `effect` release. This recipe uses Effect 4's `effect/unstable/rpc` APIs and three files in the same directory.

## Describe the request in `summary.ts`

The page and the worker share a schema, not DOM nodes or mutable UI state. RPC validates the payload and the response at the boundary.

```ts file="summary.ts"
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export const SummaryRpc = RpcGroup.make(
  Rpc.make("Summarize", {
    payload: { values: Schema.Array(Schema.Finite) },
    success: Schema.Finite,
  }),
);
```

`Summarize` accepts finite numbers and returns their total. For a domain failure you expect callers to recover from, add an `error` schema to this contract. Transport failures already appear in the client's error channel.

## Run the computation in `summary.worker.ts`

The browser runner provides the worker transport. The RPC server decodes a request and invokes the matching Effect handler.

```ts file="summary.worker.ts"
import * as BrowserWorkerRunner from "@effect/platform-browser/BrowserWorkerRunner";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/unstable/rpc";
import { SummaryRpc } from "./summary.js";

const Handlers = SummaryRpc.toLayer({
  Summarize: Effect.fn(function* ({ values }) {
    let total = 0;
    for (let start = 0; start < values.length; start += 4096) {
      const end = Math.min(start + 4096, values.length);
      for (let index = start; index < end; index++) {
        total += values[index]!;
      }
      // Let the worker process cancellation messages between chunks.
      yield* Effect.yieldNow;
    }
    return total;
  }),
});

RpcServer.layer(SummaryRpc).pipe(
  Layer.provide(Handlers),
  Layer.provide(RpcServer.layerProtocolWorkerRunner),
  Layer.provide(BrowserWorkerRunner.layer),
  Layer.launch,
  Effect.runFork,
);
```

The worker has its own runtime, so starting it here is an application boundary. Chunking matters even off the main thread: a single uninterrupted JavaScript loop cannot receive a cancellation message until it finishes. A finite input can still overflow during addition; the response schema rejects a non-finite total.

## Render the result in `SummaryView.ts`

Create the RPC client inside the component's scope. The template accepts the request Effect directly; no callback adapter, manual message listener, or intermediate state container is needed.

```ts file="SummaryView.ts"
import * as BrowserWorker from "@effect/platform-browser/BrowserWorker";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import { Layer } from "effect";
import { RpcClient } from "effect/unstable/rpc";
import { SummaryRpc } from "./summary.js";

const WorkerProtocol = RpcClient.layerProtocolWorker({ size: 1 }).pipe(
  Layer.provide(BrowserWorker.layer(() =>
    // Keep this form intact so Vite can discover and bundle the worker entry.
    new Worker(new URL("./summary.worker.ts", import.meta.url), { type: "module" }),
  )),
);

export const Summary = component(function* (values: ReadonlyArray<number>) {
  const client = yield* RpcClient.make(SummaryRpc);

  return html`
    <output aria-live="polite">Dataset total: ${client.Summarize({ values })}</output>
  `;
});

// The worker protocol lives for this rendered subscription.
export const Example = Summary([10, 20, 30]).pipe(Fx.provide(WorkerProtocol));
```

Render `Example` through your existing Typed application entry; it displays **Dataset total: 60**. The worker is created when the supplied layer is acquired, rather than when the module is imported. The component gives the RPC client and its rendered request a shared lifetime.

## Replace work without stale results

For a changing selection, switch the rendered summary with `Fx.switchMap`. The old component's scope closes and its pending RPC request is interrupted. RPC carries interruption to the worker; the chunked handler can then stop. Put `Fx.provide(WorkerProtocol)` around the whole switching view to reuse the pool across selections, instead of starting a worker for every selection.

When the owning subscription ends, the protocol closes its pool and sends the worker shutdown message. `BrowserWorkerRunner` handles that message and closes its endpoint. The browser platform does not force `Worker.terminate()`: code that never yields cannot process a shutdown message. For uncooperative third-party computation, explicitly own a dedicated native worker with `Effect.acquireRelease` and terminate it on release.

## Check the actual boundary

Check a known result, a rejected payload, and worker startup failure. Replace a large computation before it finishes and verify only the latest selection renders. Remove the view and verify the worker exits. Measure responsiveness and total latency with realistic input sizes: worker startup and structured cloning have costs, and ordinary asynchronous I/O does not need a worker.

Continue with [switching work](/explore/fx-higher-order-and-concurrency), [component lifetime](/explore/ui-component), and Effect's [browser worker platform](https://github.com/Effect-TS/effect-smol/blob/main/packages/platform-browser/src/BrowserWorker.ts). The worker entry uses [Vite's worker bundling syntax](https://vite.dev/guide/features#web-workers); the Typed view itself is independent of a site framework.

---
slug: websocket
title: Show live WebSocket updates in Typed
summary: Connect Effect's Socket and Stream to Fx, decode incoming messages, and render a scoped deployment feed.
---

A deployment dashboard receives status updates while work runs on the server. Effect owns the socket connection and its lifetime; `Stream` describes the messages; `Fx.fromStream` brings those values into a template.

## Open the connection through Effect

The server sends JSON such as `{"deployment":"api","status":"running"}`. Use Effect's `Socket` channel to connect an outgoing stream to an incoming stream:

```ts file="socket.ts"
import { Effect, Stream } from "effect";
import * as Socket from "effect/unstable/socket/Socket";

export const messages = (
  url: string,
  outgoing: Stream.Stream<string> = Stream.never,
) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const socket = yield* Socket.makeWebSocket(url, {
        openTimeout: "10 seconds",
        // Our protocol treats only normal closure as successful completion.
        closeCodeIsError: (code) => code !== 1000,
      });
      // Input values become outgoing frames; output values are incoming frames.
      return outgoing.pipe(Stream.pipeThroughChannel(Socket.toChannelString(socket)));
    }),
  );
```

`Stream.never` leaves the outgoing side idle while the server sends updates. `toChannelString` accepts text frames and decodes binary frames as UTF-8, matching this protocol's encoding. The browser constructor is a service supplied in the next step, so application code does not manage `message`, `error`, or `close` listeners.

The connection opens when this stream runs. Interrupting that run releases the socket. The APIs here come from the installed Effect 4 `effect/unstable/socket` module; see Effect's [Socket implementation](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/src/unstable/socket/Socket.ts) for the channel and platform contracts.

## Decode before rendering

Import the connection into `DeploymentStatus.ts`. Parsing JSON and checking its fields happen before a value reaches the template:

```ts file="DeploymentStatus.ts"
import { Schema, Stream } from "effect";
import * as Socket from "effect/unstable/socket/Socket";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { messages } from "./socket.js";

const Deployment = Schema.Struct({
  deployment: Schema.String,
  status: Schema.Literals(["queued", "running", "succeeded", "failed"]),
});

export const DeploymentStatus = (url: string) => {
  const updates = messages(url).pipe(
    Stream.provide(Socket.layerWebSocketConstructorGlobal),
    Stream.mapEffect((message) =>
      Schema.decodeUnknownEffect(Schema.fromJsonString(Deployment))(message),
    ),
    Stream.map(({ deployment, status }) => `${deployment}: ${status}`),
  );

  const status = Fx.fromStream(updates).pipe(
    Fx.prepend("Connecting to deployment feed…"),
    // Successful stream completion and transport failure are different states.
    Fx.append("Connection closed by the server."),
    Fx.catchTag("SocketError", () => Fx.succeed("Offline. Check your connection.")),
    Fx.catchTag("SchemaError", () => Fx.succeed("The server sent an invalid deployment update.")),
  );

  return html`
    <section aria-label="Deployment status">
      <output aria-live="polite">${status}</output>
    </section>
  `;
};
```

`Fx.fromStream` preserves the stream's values, typed errors, and service requirements. The template subscribes to it and displays successive statuses; removing the view interrupts its subscription and closes its connection. No component wrapper is needed for this view.

Each independent subscription opens a connection. If several views share a feed, give an application service ownership of one running stream and expose shared state to its children. Mount this live feed on the client; server rendering should use a finite snapshot, rather than wait for a socket that stays open. See [HTML output](/integrate/html-output) and [services and lifetime](/explore/fx-services-and-lifetime).

## Send commands through the same channel

The outgoing stream can send a subscription request before waiting for more commands:

```ts file="subscription.ts"
import { Stream } from "effect";
import * as Socket from "effect/unstable/socket/Socket";
import { messages } from "./socket.js";

const subscribe = Stream.succeed(
  JSON.stringify({ type: "subscribe", deployment: "api" }),
).pipe(Stream.concat(Stream.never));

export const apiMessages = messages("wss://example.com/deployments", subscribe).pipe(
  Stream.provide(Socket.layerWebSocketConstructorGlobal),
);
```

Replace the example URL with your server. For interactive commands, pass a stream from an application-owned `Queue` using `Stream.fromQueue`. Keep the incoming and outgoing sides on this same connection. Effect's writer waits for the connection to open, but a successful write still is not an acknowledgement that the server processed a command; model acknowledgements in the protocol.

## Decide what reconnection means

Apply a bounded `Stream.retry` policy to the transport stream before decoding when transport errors are retryable. That reruns the outgoing stream too: the subscription above is sent again on each connection. Do not automatically replay payments or other commands whose duplication changes their meaning. A normal close completes this example; `retry` only handles failures.

Use revision IDs to detect missed updates and request a fresh snapshot or replay after reconnecting. Keep schema failures visible instead of retrying malformed data indefinitely. The browser transport cannot apply receive-side backpressure; downstream stream processing does not change that. A high-volume feed needs a protocol with bounded buffering, coalescing, or replay appropriate to its data.

## Test the lifetime and the protocol

Provide a test `Socket.WebSocketConstructor` in place of the global layer, or use a local WebSocket server. Check valid updates, malformed JSON, unknown statuses, normal closure, abnormal closure, and removal while connecting. Assert that remounting creates one new connection and that the previous connection cannot update the replacement view.

For ordinary request/response data, start with [Fetch and schema decoding](/integrate/fetch-schema). For a custom source with no existing Effect abstraction, use [callback sources](/explore/building-fx).

---
slug: fetch-schema
title: Fetch and validate API data without blocking the view
summary: Use Effect's HTTP client and Schema to give Typed views validated data with cancellable requests.
---

A profile response needs three checks: did the request succeed, is its body valid JSON, and does that JSON match the application model? Effect's HTTP client handles the transport and cancellation. Schema turns the response into a value the template can use.

## Describe the request with Effect's HTTP client

In `Profile.ts`, request the profile through the `HttpClient` service. Reject non-success statuses before decoding the body.

```ts file="Profile.ts"
import { Effect, Schema } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

const Profile = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
});

export const loadProfile = Effect.fn("loadProfile")(function* (id: string) {
  const response = yield* HttpClient.get(`/api/profiles/${encodeURIComponent(id)}`).pipe(
    // Receiving an HTTP response does not imply a successful status.
    Effect.flatMap(HttpClientResponse.filterStatusOk),
  );

  // Decode the JSON body into the application's profile model.
  return yield* HttpClientResponse.schemaBodyJson(Profile)(response);
});
```

The request retains its typed errors and `HttpClient` requirement. A failed status is an HTTP client error; a structurally invalid body is a Schema error. If the screen treats a 404 specially, inspect the client's response error and status rather than parsing an error message.

## Render immediately with lazy request state

In `ProfileCard.ts`, put the request Effect into `RefSubject.make`. Constructing the ref does not execute or await the request, so the component can return its template immediately.

```ts file="ProfileCard.ts"
import { Fx, RefSubject } from "@typed/fx";
import { html, component } from "@typed/template";
import { loadProfile } from "./Profile.js";

export const ProfileCard = component(function* (id: string) {
  const profile = yield* RefSubject.make(loadProfile(id));
  const { displayName, id: profileId } = RefSubject.proxy(profile);

  return html`<article>
    <h2>${Fx.prepend(displayName, "Loading profile…")}</h2>
    <p>Account ${Fx.prepend(profileId, "…")}</p>
  </article>`;
});
```

`Fx.prepend` gives each binding initial loading text, so the DOM renderer can mount the article while the request is pending. Observing its fields starts the lazy initializer; both fields share that one request and update when decoding succeeds. `yield* profile` would instead wait for the result, so do not read it before returning the template when the view should remain non-blocking. Put loading and failure UI in the owning screen; [AsyncData](/explore/async-data) models pending, failed, successful, and refreshing data. Removing this component interrupts its request along with the rest of its running scope.

## Provide the browser transport at the application boundary

In `Browser.ts`, supply the Fetch-backed implementation. Render `profile` with the application's existing DOM runtime.

```ts file="Browser.ts"
import { Fx } from "@typed/fx";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { ProfileCard } from "./ProfileCard.js";

export const profile = ProfileCard("ada").pipe(
  Fx.provide(FetchHttpClient.layer),
);
```

The same request can receive a test client or a server client's configuration through its service requirement. For multiple screens, provide the client once around the application instead of choosing a new transport in each component. The [Effect HTTP client reference](https://effect.website/docs/v4/api/effect/unstable/http/HttpClient) describes the shared request and response operations.

## Choose who may share the result

The first read or observation starts one request per ref, and later readers share its retained result. Two independent component instances create separate refs and may request the same profile twice; this does not create an application-wide request cache. Put deliberately shared request state in an application service or cache. Include the profile ID, account or tenant, and relevant query parameters in its identity; invalidate user-specific state when the account changes.

A changing selected ID needs a replacement policy. Use [switching Fx operators](/explore/fx-higher-order-and-concurrency) to interrupt the old request when a new selection arrives. Keeping old data during refresh is a separate product choice; label its freshness so one profile is not mistaken for another.

## Check failure and interruption separately

Test a valid response, HTTP 404, malformed JSON, and structurally invalid JSON through the supplied client. Then delay a response and remove the view; confirm the underlying request is cancelled. Interruption means the owner stopped needing the work, rather than a server failure to present as an error.

The relative URL assumes a browser entry. Server rendering needs a request-aware base URL or absolute URL configured at the HTTP boundary. Keep authentication, cookies, and origin policy with that boundary so templates receive decoded values without knowing deployment details.

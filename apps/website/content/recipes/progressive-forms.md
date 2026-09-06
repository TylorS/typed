---
slug: progressive-forms
title: Enhance a server form with Typed
summary: Render a working native form on the server, then hydrate its Typed validation hints without taking over submission.
---

A newsletter form should work before JavaScript loads. Write its markup and enhancement together
in a Typed template: the server renders the form, and the browser connects its event handlers and
reactive status. The form's action and native validation work in both cases.

## Write the shared form

The input keeps its native value. Typed owns the hint through a `RefSubject`; an `EventHandler`
reads the input's validity and updates that state. There is no submit handler because submission
already has the behavior we want.

```ts file="Newsletter.ts"
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";

export const Newsletter = Fx.gen(function* () {
  const hint = yield* RefSubject.make("");
  const updateHint = EventHandler.make(
    (event: InputEvent & { target: HTMLInputElement }) => {
      const input = event.target;
      return RefSubject.set(hint,
        input.value.length === 0 ? "" : input.validity.valid
          ? "Email format looks valid."
          : "Enter a complete email address.",
      );
    },
  );

  return html`<form action="/newsletter" method="post">
    <label for="newsletter-email">Email address</label>
    <input id="newsletter-email" name="email" type="email" required
      autocomplete="email" aria-describedby="newsletter-hint"
      oninput=${updateHint}>
    <p id="newsletter-hint" aria-live="polite">${hint}</p>
    <button type="submit">Subscribe</button>
  </form>`;
});
```

`Fx.gen` creates hint state for each render run. The same `html` template supplies server markup
and browser bindings. No `.value` binding writes over an address entered before the client starts.
Keep this form's IDs unique on its page; repeated forms need distinct label and hint IDs.

The hint reports format, not deliverability. Native validation still checks the required email
field when the user submits. For longer messages, consider updating after blur instead of
announcing every intermediate edit.

## Render it before sending the response

Use the HTML renderer that preserves hydration markers. Your server returns this HTML with a
content type of `text/html`; your build supplies the browser entry at `/bootstrap.js`.

```ts file="server.ts"
import { Effect } from "effect";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { Newsletter } from "./Newsletter.js";

const page = html`<!doctype html><html lang="en">
  <head><title>Newsletter signup</title></head>
  <body>
    <main id="app">${Newsletter}</main>
    <script type="module" src="/bootstrap.js"></script>
  </body>
</html>`;

export const responseBody = renderToHtmlString(page).pipe(
  Effect.provide(HtmlRenderTemplate),
  Effect.scoped,
);
```

Even if `/bootstrap.js` never runs, the browser submits to `/newsletter`. Implement that endpoint
with server validation and a usable success or error response. Include your application's CSRF
protection when the endpoint requires it.

## Connect the same template in the browser

Pass the server-owned `#app` mount to this entry from your application's bootstrap. `render`
adopts the matching Typed HTML and installs the event handler; its scope owns the subscription
and listener cleanup.

```ts file="client.ts"
import { Effect, ManagedRuntime } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Newsletter } from "./Newsletter.js";

export const mountNewsletter = (host: HTMLElement) => {
  const runtime = ManagedRuntime.make(DomRenderTemplate.using(host.ownerDocument));
  runtime.runFork(Effect.scoped(Fx.drain(render(Newsletter, host))));
  // The navigation owner calls this when it removes the form.
  return () => runtime.dispose();
};
```

The browser entry only locates the mount and starts that Typed program:

```ts file="bootstrap.ts"
import { mountNewsletter } from "./client.js";

const host = document.getElementById("app");
if (host === null) throw new Error("Missing newsletter mount");
export const stop = mountNewsletter(host);
```

The server and browser import one shared view so their templates agree. Do not clear the host
before mounting: its existing input, value, and focus should survive hydration.
[Server rendering and hydration](/explore/server-rendering-and-hydration) explains that handoff.

## Decode the submission with UI and Effect

Use UI's FormData adapter at the server boundary. It preserves repeated names as arrays instead
of silently choosing one value. This schema requires one nonempty string for `email`; add your
server's email policy and confirmation workflow before accepting a subscription.

```ts file="submission.ts"
import { Schema } from "effect";
import * as Form from "@typed/ui/Form";

const NewsletterFields = Schema.Struct({
  email: Schema.String.check(Schema.isNonEmpty()),
});

export const decodeNewsletter = (data: FormData) =>
  Form.decodeFormData(NewsletterFields, data);
```

Native constraint validation is a convenience, not a server trust boundary. The server must
reject invalid submissions even when JavaScript is disabled or the request bypasses the browser.
For richer client form state and submissions, continue with
[forms as a browser contract](/explore/forms-as-a-browser-contract).

## Verify the handoff

Submit with JavaScript disabled, then repeat with the enhancement enabled using both Enter and
the submit button. Test invalid and valid server responses. Type before hydration and retain the
input node: mounting should preserve its identity, value, and focus. After mounting, an invalid
address should update the hint; after disposal, the same event should no longer update it.

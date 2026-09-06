---
title: "Interpolate into text-only elements"
summary: "Keep textarea, title, script, and style content in the context the browser gives it, with explicit limits around escaping, closing tags, and trust."
section: "Template bindings"
kind: "deep-dive"
order: 7
---

An article editor may need a textarea for notes, a document title, and a JSON data script in its
server response. Each contains text, but they do not use one interchangeable HTML escaping rule.
The surrounding element determines how the browser parses its contents and what can accidentally
end that context.

Read [scalar bindings](/explore/template-element-bindings) first. This page separates the initial
text context from live properties and explains the serialization boundary a server renderer must
preserve.

## Start with text that must remain text

```ts
import { html } from "@typed/template";

const notes = "Remember the <scope> example & its cleanup rule.";
export const editor = html`<label>
  Article notes
  <textarea name="notes">${notes}</textarea>
</label>`;
export const title = html`<title>${"Saved articles & notes"}</title>`;
```

The `<scope>` text in the textarea does not create an element. Typed recognizes these positions as
text-only content, not a child range in which nested markup can install another component. The HTML
renderer escapes ordinary textarea/title text; the DOM renderer writes the corresponding text
content.

For editing, the textarea body supplies initial content. Its current edit buffer is the live
`.value` property, just as with an input. If application state should control later edits, bind that
property and capture events. Updating initial markup and controlling current editing are separate
decisions.

An Effect, Fx, or Stream can supply these text values. Their ordinary producer lifetime remains;
choosing a text-only position changes the interpretation of each value, not who owns its subscription.

## Serialize the inner format before protecting the outer HTML

A JSON data script has two contracts: valid JSON inside and an intact HTML script element around it.
Serialize the JSON first:

```ts
import { html } from "@typed/template";

const article = {
  id: "scope",
  note: "A literal </script> can occur in saved text.",
};
export const initialData = html`<script type="application/json">
  ${JSON.stringify(article)}
</script>`;
```

A generic HTML entity escape is not a substitute for raw-text closing-tag handling. The HTML parser
can recognize a dynamic `</script>` as the end of the element even though it occurred inside the
format you meant to embed. Typed neutralizes the matching closing tag's opening `<` in dynamic
script text with `\\u003c`.

That protection does not validate the JSON schema, quote arbitrary JavaScript into a valid literal,
or make authored executable code safe. The application still owns the chosen inner format.

## Choose the escaping rule by element

| Context | Serialized dynamic content | Remaining responsibility |
| --- | --- | --- |
| `textarea`, `title` | HTML text escaping | choose initial text versus live properties |
| `script` | neutralize matching closing tags with `\\u003c` | valid JSON or intentionally authored JavaScript |
| `style` | neutralize matching closing tags with `\\3C ` | valid, appropriate CSS |
| legacy `xmp` | neutralize matching closing tags with `&lt;` | avoid using legacy markup for new UI |

Authored literal script/style content remains authored code. Typed does not sanitize JavaScript,
CSS, URLs, or arbitrary literal markup. It protects the relevant dynamic context boundary.
`plaintext` is recognized by parsing but cannot carry a reliable closing/hydration boundary;
rendering it throws. It is not an alternative escaping strategy.

For CSS, keep the same division of responsibilities:

```ts
import { html } from "@typed/template";

const authoredCss = ".article-note { white-space: pre-wrap; }";
export const stylesheet = html`<style>${authoredCss}</style>`;
```

Do not interpolate unvalidated CSS merely because the closing tag is neutralized. For ordinary
component appearance, a stylesheet and class contributions are usually a clearer boundary than
constructing dynamic stylesheet text.

## Keep renderer-owned HTML distinct from application data

`HtmlRenderEvent` is a serializer's explicit output type. It does not sanitize its input string.
Even branded output follows text escaping in `textarea` and `title`; raw-text contexts use its
renderer-owned string with matching closing-tag neutralization.

```ts
import { html, HtmlRenderEvent } from "@typed/template";

// The producing serializer owns the format and trust policy for this constant.
const serialized = HtmlRenderEvent('{"id":"scope","kind":"article"}', true);
export const data = html`<script type="application/json">${serialized}</script>`;
```

Application data should use ordinary interpolation, as in `initialData`. Wrapping user input in
`HtmlRenderEvent` would assert a serialization responsibility that has not actually been fulfilled.
The [HTML output contract](/explore/html-render-event) explains when a library legitimately owns it.

## Test what the browser parsed

A substring assertion on the response is insufficient. Parse the serialized response, count the
resulting elements, and inspect their text. For the JSON example, parse the data script's text as
JSON and compare the recovered note. This checks both the outer boundary and inner format.

For a textarea, test initial content separately from a later `.value` update and a user's edit.
For hydratable output, retain the server element and assert adoption identity as well as text.
Matching markers prove compatible template structure, not a trust policy or valid application data.

The [HtmlChunk reference](/reference/modules/%40typed%2Ftemplate%2FHtmlChunk) exposes context-aware
serialization for renderer authors. [Hydrating Typed HTML](/explore/hydrating-typed-html) explains the
separate browser adoption contract.

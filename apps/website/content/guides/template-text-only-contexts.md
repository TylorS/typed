---
title: "Interpolate into text-only elements"
summary: "Keep textarea, title, script, and style content in the context the browser gives it, with explicit limits around escaping, closing tags, and trust."
section: "Template bindings"
kind: "deep-dive"
order: 91
---

A textarea, document title, and JSON data script all contain text, but require different escaping.
The surrounding element determines how the browser parses its contents and what can end that
context.

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

Closing-tag protection does not validate CSS. Use a stylesheet and class bindings for ordinary
component appearance rather than constructing dynamic stylesheet text.

Application data should use ordinary interpolation, as in `initialData`. Renderer authors who
produce already serialized output should read the [HTML output contract](/explore/html-render-event).

## Test what the browser parsed

A substring assertion on the response is insufficient. Parse the serialized response, count the
resulting elements, and inspect their text. For the JSON example, parse the data script's text as
JSON and compare the recovered note. This checks both the outer boundary and inner format.

For a textarea, test initial content separately from a later `.value` update and a user's edit.

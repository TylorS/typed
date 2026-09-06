---
title: "Class names without className replacement"
summary: "Understand the local token ledger that lets Typed update its classes while preserving classes added by other code."
section: "Template bindings"
kind: "deep-dive"
order: 3
---

A saved-article row can be selected by the application and animated by a separate library. Both
need classes on the same element. Replacing `className` with the application's complete string
would erase the animation library's state. A Typed class part instead keeps track of its own tokens
and changes only that contribution.

This is a specific cooperative-DOM contract, not automatic merging of arbitrary writes. Read
[scalar bindings](/explore/template-element-bindings) first; this page explains why class collections
need different bookkeeping.

## Describe domain state as a contribution

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SelectableArticle = component(function* () {
  const selected = yield* RefSubject.make(false);
  const stateClass = selected.pipe(RefSubject.map((value) => value ? "is-selected" : ""));
  const toggle = RefSubject.update(selected, (value) => !value);

  return html`<article class="article ${stateClass}">
    <h2>Understanding resource scopes</h2>
    <button type="button" aria-pressed=${selected} onclick=${toggle}>Select article</button>
  </article>`;
});
```

The sparse expression combines `article` and the current state token into one class part. At first
that part contributes `article`. Selecting adds `is-selected`; deselecting removes `is-selected`
while retaining `article`. The article node and its button are unchanged.

Now suppose an animation library adds `is-entering` after mounting. That token is absent from the
part's contribution ledger, so selecting and deselecting leave it alone. The animation library can
remove its own token when its animation finishes.

## See where cooperation stops

The native class list stores each token once. It has no owner ID or reference count. If both systems
claim `is-selected`, the DOM cannot distinguish their contributions when Typed removes the token.
Choose separate tokens for separate responsibilities, or give one system the authority to compute
the shared token.

Likewise, a foreign writer assigning a complete `className` can erase Typed's tokens. A contribution
ledger does not prevent that external write. If another owner removes a token and Typed's next value
contains exactly the same local token set, no transition necessarily re-adds it. Typed responds to
input changes; it does not continuously enforce the whole class attribute.

These limits are useful design information. Put selection in `is-selected`, animation in
`is-entering`, and a plugin's state in its own token. Do not ask both libraries to maintain a complete
"correct class string" for the shared element.

## Normalize before comparing

Strings split on ASCII whitespace, arrays flatten recursively, and nullish values contribute no
tokens. This lets a projection produce a single state token or a group without changing ownership:

```ts
import { html } from "@typed/template";

const state = ["article", ["is-selected", null], "has-note"];
export const row = html`<article class=${state}>Understanding resource scopes</article>`;
```

The cost depends on the previous and next local token collections, not on the number of descendants
in the article or nodes elsewhere on the page. A very large generated class list still takes work
to normalize and compare. Sparse literal segments participate in the same ledger; they are not
independent writes to the attribute.

## Hydration doesn't claim all server classes

The updater's ledger starts empty, including on an adopted server element. Its first input records
what that part contributes. An unrelated server token is not silently adopted as Typed-owned state.

For example, server markup can contain `article analytics-ready`. The first class value is
`article is-selected`. A later value of `article` removes `is-selected` and leaves `analytics-ready`.
If the first input had itself included `analytics-ready`, later omission would remove it. The source
of truth for contribution is the values this part receives, not every class found on the element.

A spread's class entry uses the same mechanism; disposing that entry removes its recorded tokens.
See [Spread props and data records](/explore/template-spreads-data) for the larger per-key lifetime.

## Diagnose the writer, not just the final class string

To investigate a disappearing animation, record three moments: Typed's initial emitted tokens, the
animation library's mutation, and Typed's next emitted tokens. Look for either a shared token or a
whole-attribute assignment. A DOM breakpoint on the class attribute can identify the latter.

A focused test should add a foreign token after mounting, toggle selection, then clear Typed's
state contribution. Assert the article is still the same object, the expected local token changed,
and the foreign token survived. Add a matching hydration case if preexisting server classes matter.
Those tests establish the actual cooperation contract without claiming all third-party class writers
are compatible.

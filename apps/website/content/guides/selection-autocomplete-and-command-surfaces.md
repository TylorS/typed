---
title: "Selection, autocomplete, and command surfaces"
summary: "Build a project switcher from a compact known-value choice to searchable input, then attach commands to the project actually selected."
section: "UI"
kind: "guide"
order: 4.5
---

Imagine a project dashboard with a switcher in its header. At first there are three projects, so a
compact choice works well. Later there are hundreds, and people need to type a name. Beside the
switcher is an Actions button that duplicates the current project.

All three surfaces can look like lists, but they do different jobs. The switcher commits a project;
search temporarily holds text that might not name any project; Actions runs a command against the
project already committed. If one generic selected-item variable represents all three, merely
browsing suggestions can accidentally change the command's target. We will keep those facts
separate while building the interface.

## Begin with a known set of projects

For an ordinary form field, a native `<select>` gives you value submission and browser interaction
with little application code. A custom popup is justified when the surrounding design needs a
button and custom option presentation. This version uses `@typed/ui/Select` to make that boundary
explicit: a trigger opens the listbox, and an option commits a value.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Select from "@typed/ui/Select";

export const CompactProjectSwitcher = component(function* () {
  const state = yield* Select.makeState({ id: "project-picker", value: "atlas" });
  const collection = yield* Select.makeCollection();
  const projects = [
    { id: "atlas", name: "Atlas" },
    { id: "beacon", name: "Beacon" },
    { id: "cedar", name: "Cedar" },
  ];
  const selectedName = RefSubject.map(state, ({ value }) =>
    projects.find((project) => project.id === value)?.name ?? "Choose a project",
  );

  return html`<section>
    ${Select.Trigger({ state, content: html`Project: ${selectedName}` })}
    ${Select.Content({ state, collection, content: projects.map((project) =>
      Select.Option({ state, collection, id: `project-option-${project.id}`,
        value: project.id, textValue: project.name, content: project.name }),
    ) })}
    <p>Current project: ${selectedName}</p>
  </section>`;
});
```

The project ID is application data, while `project-option-atlas` is a DOM identity. Keeping them
different lets multiple interfaces reference the same project without duplicating element IDs.
`textValue` gives typeahead a human-facing name even when the saved value is a slug. Each option
registers its actual element in the shared collection when rendered.

Open the switcher and arrow to Beacon. Select moves active identity without replacing the saved
value. Enter or Space commits Beacon and closes the popup; Escape closes without committing the
active alternative and restores trigger focus. This is useful when people want to inspect choices
before changing the dashboard. See [Select](/reference/modules/%40typed%2Fui%2FSelect) for its public
parts and transitions.

A persistent sidebar that previews projects as you browse is a different design. There,
[Listbox](/explore/ui-listbox) can be appropriate: its normal focus movement also selects the value.
That would make a poor drop-in replacement if this dashboard must wait for an explicit commit.
The [APG listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) discusses that selection
behavior. The role name alone does not tell your application when it is safe to start loading a
new project.

## Add search without turning every keystroke into a project change

When the project list grows, editable search becomes useful. A Combobox has current text, an active
suggestion, and popup visibility. It does not have a separate domain record proving that the text
was accepted. A person can type “Beacon” exactly, or type “Beac” and stop. Both are valid input states;
only the first can identify a known project in this example.

Our searchable version makes the commit boundary visible with an Open project button. Selecting a
suggestion fills the input. Pressing Open validates the text and updates the actual dashboard
project. The Actions menu always reads that committed project, never the search text or active
suggestion.

```ts
import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Combobox from "@typed/ui/Combobox";
import * as Menu from "@typed/ui/Menu";

export const SearchableProjectDashboard = component(function* () {
  const projects = [
    { id: "atlas", name: "Atlas" },
    { id: "beacon", name: "Beacon" },
    { id: "cedar", name: "Cedar" },
  ];
  const currentProject = yield* RefSubject.make("atlas");
  const notice = yield* RefSubject.make("Atlas is open.");
  const drafts = yield* RefSubject.make<ReadonlyArray<string>>([]);
  const search = yield* Combobox.makeState({ id: "dashboard-project-search", value: "Atlas" });
  const suggestions = yield* Combobox.makeCollection();
  const actions = yield* Menu.makeState({ id: "dashboard-project-actions" });
  const commands = yield* Menu.makeCollection();

  const openProject = Effect.flatMap(search, ({ value }) => {
    const match = projects.find((project) => project.name.toLowerCase() === value.trim().toLowerCase());
    return match === undefined
      ? RefSubject.set(notice, "Choose a known project before opening it.")
      : Effect.andThen(
          RefSubject.set(currentProject, match.id),
          RefSubject.set(notice, `${match.name} is open.`),
        );
  });
  const duplicateProject = Effect.flatMap(currentProject, (id) =>
    RefSubject.update(drafts, (current) => [...current, `${id} copy ${current.length + 1}`]),
  );
  const currentName = RefSubject.map(currentProject, (id) =>
    projects.find((project) => project.id === id)?.name ?? "Unknown project",
  );

  return html`<section>
    <label for="dashboard-project-search-input">Find a project</label>
    ${Combobox.Input({ state: search, collection: suggestions, placeholder: "Type a project name" })}
    ${Combobox.Popover({ state: search, collection: suggestions, content: projects.map((project) =>
      Combobox.Item({ state: search, collection: suggestions, id: `dashboard-match-${project.id}`,
        value: project.name, content: project.name,
        props: { "?hidden": RefSubject.map(search, ({ value }) =>
          !project.name.toLowerCase().includes(value.toLowerCase())) },
      }),
    ) })}
    <button type="button" onclick=${openProject}>Open project</button>
    <p role="status">${notice}</p>
    <h2>${currentName}</h2>
    ${Menu.Trigger({ state: actions, content: html`Actions for ${currentName}` })}
    ${Menu.Content({ state: actions, collection: commands, label: "Project actions", content:
      Menu.Item({ state: actions, collection: commands, id: "dashboard-duplicate",
        textValue: "Duplicate project", content: "Duplicate project",
        props: { onclick: duplicateProject },
      }),
    })}
    <p>Local draft copies: ${RefSubject.map(drafts, (items) => items.join(", ") || "None")}</p>
  </section>`;
});
```

This is a local interaction example: duplication appends a draft record to a RefSubject so the
command's target is visible. Replacing it with a server request does not change where the target
comes from. Read the committed project at activation time and pass that identity to the request;
do not close over the search text from a previous render or use whichever suggestion is highlighted.

## Follow one search interaction all the way through

Start with Atlas open, clear the input, then type “Be”. `Combobox.setValue` is the transition used by
the input handler: it writes the text, clears active identity, and opens suggestions. Our `hidden`
bindings leave Beacon available and hide nonmatches. The family checks hidden ancestors when
choosing visible registered options; changing only opacity would not provide the same filtering.

ArrowDown activates Beacon while native focus stays in the input. The input's
`aria-activedescendant` names the option, so text editing and suggestion navigation can coexist.
Enter accepts the active suggestion and closes the popup. That updates search text to “Beacon” but
leaves Atlas open. Open project then validates Beacon and changes `currentProject`. Only now does
the heading and Actions button name Beacon.

If the user types “Beac” and presses Open, the message explains that no known project was committed;
Atlas remains the command target. If the user changes their mind and presses Escape while browsing,
the popup closes. This example does not promise that Escape restores an earlier text snapshot;
Combobox owns popup dismissal, not an application undo history. The
[APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) describes several autocomplete
variants; this family is an editable input with list suggestions, not every variant on that page.

For remote projects, keep query work driven by text rather than active suggestion movement.
Otherwise arrowing through matches would issue more requests. Reject stale responses from an older
query, represent loading and failed searches separately, and clear active identity when replacing
results so it never names a removed option. The collection is a registry of mounted suggestions,
not a remote data cache. The [Combobox guide](/explore/ui-combobox) develops these boundaries further.

## Attach commands without inventing a form value

The menu uses its own state and collection. Opening it establishes command focus; arrows and
typeahead navigate commands, including disabled commands that remain discoverable. Enter or Space
activates the focused item. An ordinary Menu.Item closes on activation, Escape requests focus
restoration to the invoker, and Tab closes while allowing ordinary tab navigation. These are command
interactions, so there is no selected project value inside Menu state.

Both custom selection popups and menus use the
[native Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). Preserve their
refs and toggle handlers in custom hosts so `open` agrees with native visibility. A manual popover
is not automatically a modal dialog or a generic light-dismiss surface. The
[APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) supplies the broader interaction
vocabulary; [Menu](/explore/ui-menu) covers checked items and explicit submenu ownership.

Typed provides the component state transitions, roles, native popup wiring, and collection-backed
keyboard behavior used here. Authors must provide the domain commit rule and command effects.
That division is visible in the code: `openProject` decides whether text names a project, and
`duplicateProject` decides what duplication means. A role attribute cannot make those decisions.

To verify the assembled flow, keep Atlas open while typing and highlighting Beacon, then activate
Duplicate before pressing Open: the draft must name Atlas. Repeat after Open: it must name Beacon.
During suggestion navigation, assert the input remains `document.activeElement`; during menu
navigation, assert a menu item actually receives focus. This one scenario exercises both business
correctness and the two different browser focus models, which a selected-ID unit test would miss.

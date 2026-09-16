---
title: "Selection, autocomplete, and command surfaces"
summary: "Keep editable search, active suggestions, committed values, and command targets separate."
section: "UI"
kind: "guide"
order: 4.5
---

Select commits a value. Combobox holds editable text and an active suggestion. Menu runs commands.
These states can look alike on screen, but they have different commit rules. This guide keeps
search text separate from a committed choice, then runs a command against that choice.

Read [Component](/explore/ui-component) and [reactive state](/explore/refsubject-renderer-independent-state)
first. The example uses three project names as choices; it does not load or create projects.

## Choose by commit behavior

| Surface | State it owns | When a choice takes effect |
| --- | --- | --- |
| Native `<select>` | Form value | Native selection changes the value |
| [Select](/explore/ui-select) | Saved value and active option | Enter, Space, or option activation commits; arrow movement does not |
| [Combobox](/explore/ui-combobox) | Input text, active suggestion, popup visibility | Accepting a suggestion updates text; application code decides what that text means |
| [Menu](/explore/ui-menu) | Active command and popup visibility | Activating an item runs a command; there is no selected domain value |

Use a native `<select>` for an ordinary form field unless you need a custom popup. A
[Listbox](/explore/ui-listbox) has another policy: normal focus movement also selects its value.
Choose that behavior deliberately when browsing should immediately change the choice.

## Keep the search text separate from the committed ID

Selecting a suggestion below fills the input. Pressing **Open project** validates the text and
changes `currentProject`. Until then, commands still use the previous committed ID. Typing the
complete name “Beacon” and typing the partial name “Beac” are both valid input states, but only the
first can identify a project here.

```ts
import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import * as Combobox from "@typed/ui/Combobox";
import * as Menu from "@typed/ui/Menu";

export const ProjectPicker = component(function* () {
  const projects = [
    { id: "atlas", name: "Atlas" },
    { id: "beacon", name: "Beacon" },
    { id: "cedar", name: "Cedar" },
  ];

  const currentProject = yield* RefSubject.make("atlas");
  const notice = yield* RefSubject.make("Atlas is open.");

  const search = yield* Combobox.makeState({ id: "project-search", value: "Atlas" });
  const suggestions = yield* Combobox.makeCollection();

  const actions = yield* Menu.makeState({ id: "project-actions" });
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

  const showTarget = Effect.flatMap(currentProject, (id) =>
    RefSubject.set(notice, `Command target: ${id}`),
  );

  const currentName = RefSubject.map(currentProject, (id) =>
    projects.find((project) => project.id === id)!.name,
  );

  const options = projects.map((project) => Combobox.Item({
    state: search,
    collection: suggestions,
    id: `project-match-${project.id}`,
    value: project.name,
    content: project.name,
    props: {
      "?hidden": RefSubject.map(search, ({ value }) =>
        !project.name.toLowerCase().includes(value.toLowerCase())),
    },
  }));

  const targetCommand = Menu.Item({
    state: actions,
    collection: commands,
    id: "project-show-target",
    textValue: "Show command target",
    content: "Show command target",
    props: { onclick: showTarget },
  });

  return html`<section>
    <label for="project-search-input">Find a project</label>
    ${Combobox.Input({ state: search, collection: suggestions, placeholder: "Type a project name" })}
    ${Combobox.Popover({ state: search, collection: suggestions, content: options })}
    <button type="button" onclick=${openProject}>Open project</button>
    <p>Current project: ${currentName}</p>
    ${Menu.Trigger({ state: actions, content: html`Actions for ${currentName}` })}
    ${Menu.Content({ state: actions, collection: commands, label: "Project actions", content: targetCommand })}
    <p role="status">${notice}</p>
  </section>`;
});
```

The project ID (`atlas`) is domain data; the option ID (`project-match-atlas`) identifies a DOM
element. Keeping them separate lets another picker refer to the same project with its own element
IDs. Each rendered option registers its element in `suggestions`.

`showTarget` reads `currentProject` when the command runs. The visible status makes that read easy to
check. A command that sends a request would read the committed ID at the same boundary; it should
not use search text or whichever suggestion happens to be highlighted.

## Follow one interaction through its commit points

Start with Atlas open, clear the input, then type “Be”. `Combobox.setValue`, used by the input
handler, writes the text, clears active identity, and opens suggestions. The `hidden` bindings hide
nonmatches. The collection checks hidden ancestors when choosing visible options; changing opacity
alone would not provide the same filtering.

ArrowDown activates Beacon while native focus stays in the input. Its `aria-activedescendant`
names the option. Enter accepts Beacon and closes the popup: search text becomes “Beacon”, but
`currentProject` stays `atlas`. Press **Open project** to commit Beacon. Only then do the current
project and Actions label change.

If you type “Beac” and press Open, the status explains that no known project was committed. Escape
closes the suggestion popup; it does not promise to restore an earlier text snapshot. See
[Combobox](/explore/ui-combobox) for input and suggestion behavior, including changing result sets.

## Check what the command reads

Keep Atlas open while typing and highlighting Beacon, then activate **Show command target** before
pressing Open: the status must name `atlas`. Repeat after Open: it must name `beacon`.

Also check the two focus models: during suggestion navigation, the input remains
`document.activeElement`; during menu navigation, a menu item receives focus. Menu owns command
navigation and dismissal, while `showTarget` owns the action. See [Menu](/explore/ui-menu) for its
keyboard behavior and custom-host contract.

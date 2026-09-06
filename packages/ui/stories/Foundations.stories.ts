import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as AlertComponent from "../src/Alert.js";
import * as CollectionComponent from "../src/Collection.js";
import * as CompositeComponent from "../src/Composite.js";
import * as DomComponent from "../src/Dom.js";
import * as FocusableComponent from "../src/Focusable.js";
import * as GroupComponent from "../src/Group.js";
import * as HeadingComponent from "../src/Heading.js";
import * as RoleComponent from "../src/Role.js";
import * as SeparatorComponent from "../src/Separator.js";
import * as VisuallyHiddenComponent from "../src/VisuallyHidden.js";
import { story } from "./story.js";

export default { title: "Foundations" };

export const Alert = story(AlertComponent.Alert({ content: "Your profile has been saved.", props: { class: "story-success" } }));

const collection = Fx.gen(function* () {
    const state = yield* CollectionComponent.makeState([
      { id: "alpha", value: "Alpha" },
      { id: "beta", value: "Beta" },
      { id: "gamma", value: "Gamma" },
    ]);

    return html`<section aria-label="Collection state" data-count=${(yield* state).length}>
      <p>Collection items:</p>
      <ul>
        <li id="alpha">Alpha</li>
        <li id="beta">Beta</li>
        <li id="gamma">Gamma</li>
      </ul>
    </section>`;
});

export const Collection = story(collection);

const composite = Fx.gen(function* () {
    const state = yield* CompositeComponent.makeState({ activeId: "first" });
    const items = yield* CollectionComponent.makeState([
      { id: "first", value: "First" },
      { id: "second", value: "Second" },
      { id: "third", value: "Third" },
    ]);
    const options = { state, collection: items };
    const activeId = RefSubject.map((current: CompositeComponent.State) => current.activeId ?? "none")(state);
    const hydrate = RefSubject.hydrateAll(state);

    return html`<section aria-label="Composite navigation" ref=${hydrate}>
      <p>
        Composite keeps one active item. Current item:
        <output aria-live="polite">${activeId}</output>
      </p>
      <div role="toolbar" aria-label="Composite controls">
        <button type="button" onclick=${EventHandler.make(() => CompositeComponent.move(options, "previous"))}>
          Previous
        </button>
        <button type="button" onclick=${EventHandler.make(() => CompositeComponent.move(options, "next"))}>
          Next
        </button>
      </div>
    </section>`;
});

export const Composite = story(composite);

export const Dom = story(
  DomComponent.renderDivHost({ role: "note", tabindex: 0 }, "Rendered through Dom.renderDivHost"),
);

export const Focusable = story(
  FocusableComponent.Focusable({ content: "An explicit keyboard focus stop" }),
);

export const Group = story(
  GroupComponent.Group({
    label: "Text alignment",
    content: html`${GroupComponent.Label({ content: "Text alignment" })}
      <button type="button">Left</button>
      <button type="button">Center</button>
      <button type="button">Right</button>`,
  }),
);

export const Heading = story(HeadingComponent.Heading({ level: 2, content: "Section heading" }));

export const Role = story(RoleComponent.Role({ role: "status", content: "Ready" }));

export const Separator = story(SeparatorComponent.Separator({}));

export const VisuallyHidden = story(
  html`<button type="button">Close${VisuallyHiddenComponent.VisuallyHidden({ content: " dialog" })}</button>`,
);

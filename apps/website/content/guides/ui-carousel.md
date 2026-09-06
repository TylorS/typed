---
title: "Carousel: slide identity, controls, and rotation policy"
summary: "Build a manual slide sequence and understand the state required before adding automatic motion."
section: "UI / Collections"
kind: "deep-dive"
order: 250
---

A project walkthrough has three steps: Create, Review, and Share. A person advances at their own
pace with Next, and can return with Previous. We will build that manual sequence first, without
adding automatic motion that the experience does not need. It makes slide identity, control focus,
and hidden content lifetime easy to see. If the product later requests rotation, the same example
shows exactly what the paused flag supplies and what a scoped scheduler would still need to do.

## Start with a manual walkthrough

`paused` defaults true. This example has no timer and therefore no misleading rotation control:
Previous and Next are sufficient. Each slide stays mounted; selection changes its `hidden` state.

```ts
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Carousel from "@typed/ui/Carousel";

export const ProjectWalkthrough = component(function* () {
  const state = yield* Carousel.makeState({ activeId: "walkthrough-create", paused: true });
  const collection = yield* Carousel.makeCollection();
  return Carousel.Root({ state, label: "Project walkthrough", content: [
    html`<div>
      ${Carousel.Previous({ state, collection, content: "Previous step" })}
      ${Carousel.Next({ state, collection, content: "Next step" })}
    </div>`,
    Carousel.Slide({ state, collection, id: "walkthrough-create", label: "1 of 3: Create",
      content: html`<h3>Create a project</h3><p>Give the project a name and owner.</p>` }),
    Carousel.Slide({ state, collection, id: "walkthrough-review", label: "2 of 3: Review",
      content: html`<h3>Review the draft</h3><p>Invite teammates to review the details.</p>` }),
    Carousel.Slide({ state, collection, id: "walkthrough-share", label: "3 of 3: Share",
      content: html`<h3>Share the result</h3><p>Publish once the review is complete.</p>` }),
  ] });
});
```

The root renders a labeled region with carousel role description. Slides render labeled groups
with slide role description. The controls are native `type=button` elements, so normal Tab,
Enter, and Space work. A click changes `activeId` without transferring focus to the newly revealed
slide; keeping focus on the control allows repeated navigation.

## A slide registry is not a timer

`Carousel.move(state, collection, "next" | "previous")` selects the adjacent registered slide in
DOM order and wraps. The controls need the collection; without it their internal action is inert.
`Carousel.select(state, id)` changes slide identity directly. Neither operation creates animation,
preloading, or automatic rotation. The collection includes hidden slides because those are the
next available destinations.

`paused` is a policy flag. `RotationControl` toggles it, but no built-in scheduler observes it to
advance slides. Adding that control to the manual example alone would promise motion that never
occurs. If your product needs rotation, create a scoped timer that checks `paused` and advances using
`move`; dispose it with the rendered component and avoid starting a new untracked timer on every
state emission. See [Fx lifetime](/explore/fx-services-and-lifetime) before adding recurring work.

## Pause behavior must cooperate with the scheduler

The root pauses on focus entering. Focus-triggered pause remains paused until an explicit restart.
Mouse entry temporarily pauses and records whether rotation had been running; mouse leave resumes
only that pointer-paused state. Focus entry clears the pending pointer resume. These transitions
are already supplied, but they only affect motion if the application's scheduler honors the flag.

The [APG carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) explains the need to let
people stop rotation and read content without unexpected replacement. For an automatic variant,
put a clearly labeled rotation control before rotating content in the tab sequence, derive its
label from paused state, and test focus and hover interactions together. Account for reduced-motion
preferences and distinguish automatic updates from user-requested transitions in announcement policy.
The primitive does not supply an automatic live region or a motion preference service.

## Visibility is not lifetime

A slide's [hidden attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
removes it from normal presentation while keeping its DOM and subscriptions mounted. Videos,
network work, or local timers can remain alive in hidden slides. Pause that work explicitly if the
slide should stop consuming resources. Avoid CSS that overrides hidden rendering, and keep the
navigation controls outside slide content so selecting a slide cannot hide the focused control.

If slide data changes, preserve the current ID when possible and choose a successor when it is
removed. Selecting a nonexistent ID hides every slide; the state constructor does not validate
membership. A keyed dynamic list preserves retained DOM identity, but still needs this application
reconciliation policy.

Test exactly one visible slide, both wrap directions, focus remaining on Previous/Next, and active
slide removal. For automatic rotation, also test focus pause, pointer resume, explicit stop/start,
and scope disposal. A static state assertion alone cannot prove that the actual timer stopped.
Public parts: [Carousel](/reference/modules/%40typed%2Fui%2FCarousel).

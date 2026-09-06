import { Effect } from "effect";
import { whilePageActive } from "./Browser.js";
import { enhanceMarbles } from "./components/MarblePlayback.js";
import { sidebarNavigation } from "./components/SidebarNavigation.js";

export const page = (document: Document) =>
  Effect.gen(function* () {
    // Reveal the selected article immediately, including on diagram-heavy pages.
    yield* Effect.forkScoped(whilePageActive(document.defaultView!, sidebarNavigation(document)));
    // Cached navigation retains the mounted views, including native disclosure
    // and scroll state. Each player pauses its work when the page is hidden.
    yield* enhanceMarbles(document);
    yield* Effect.never;
  }).pipe(Effect.scoped);

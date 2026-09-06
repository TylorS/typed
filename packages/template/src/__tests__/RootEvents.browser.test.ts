import { Effect, Exit, Scope } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { CurrentRootEvents, rootEvents, type RootEventOptions } from "../RootEvents.js";

const scopes: Array<Scope.Closeable> = [];
async function install(root: EventTarget, inherited: RootEventOptions, options?: RootEventOptions) {
  const scope = await Effect.runPromise(Scope.make());
  scopes.push(scope);
  await Effect.runPromise(
    rootEvents(root, options).pipe(
      Effect.provideService(Scope.Scope, scope),
      Effect.provideService(CurrentRootEvents, inherited),
    ),
  );
  return scope;
}

function fixture() {
  const parent = document.createElement("div");
  const root = document.createElement("section");
  const button = document.createElement("button");
  root.append(button);
  parent.append(root);
  document.body.append(parent);
  return { parent, root, button };
}

afterEach(async () => {
  await Promise.all(
    scopes.splice(0).map((scope) => Effect.runPromise(Scope.close(scope, Exit.void))),
  );
  document.body.replaceChildren();
});

describe("root event propagation", () => {
  it("preserves native bubbling by default", async () => {
    expect(Effect.runSync(CurrentRootEvents)).toBe(false);
    const { parent, root, button } = fixture();
    const events: string[] = [];
    parent.addEventListener("click", () => events.push("parent"));
    button.addEventListener("click", () => events.push("target"));
    await install(root, false);
    button.click();
    expect(events).toEqual(["target", "parent"]);
  });

  it("stops selected bubbling while retaining target/root handlers, capture, and defaults", async () => {
    const { parent, root, button } = fixture();
    const events: string[] = [];
    parent.addEventListener("click", () => events.push("capture"), true);
    parent.addEventListener("click", () => events.push("parent"));
    button.addEventListener("click", () => events.push("target"));
    await install(root, { click: true });
    // A listener registered after the boundary listener still runs on the same root.
    root.addEventListener("click", () => events.push("root"));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(button.dispatchEvent(click)).toBe(true);
    expect(click.defaultPrevented).toBe(false);
    expect(events).toEqual(["capture", "target", "root"]);
  });

  it("merges per-event overrides and lets false disable the whole inherited policy", async () => {
    const { parent, root, button } = fixture();
    const events: string[] = [];
    for (const name of ["click", "change", "input", "allowed"]) {
      parent.addEventListener(name, () => events.push(name));
    }
    const scope = await install(root, { click: true, change: true }, { click: false, input: true });
    for (const name of ["click", "change", "input", "allowed"]) {
      button.dispatchEvent(new Event(name, { bubbles: true }));
    }
    expect(events).toEqual(["click", "allowed"]);
    await Effect.runPromise(Scope.close(scope, Exit.void));
    await install(root, { click: true, change: true }, false);
    button.click();
    button.dispatchEvent(new Event("change", { bubbles: true }));
    expect(events).toEqual(["click", "allowed", "click", "change"]);
  });

  it("removes boundary listeners when their scope closes", async () => {
    const { parent, root, button } = fixture();
    let received = 0;
    parent.addEventListener("click", () => received++);
    const scope = await install(root, false, { click: true });
    button.click();
    expect(received).toBe(0);
    await Effect.runPromise(Scope.close(scope, Exit.void));
    button.click();
    expect(received).toBe(1);
  });

  it("does not intercept a nonbubbling event below the root", async () => {
    const { parent, root, button } = fixture();
    const events: string[] = [];
    parent.addEventListener("local", () => events.push("capture"), true);
    button.addEventListener("local", (event) => events.push(String(event.cancelBubble)));
    await install(root, { local: true });
    button.dispatchEvent(new Event("local", { bubbles: false }));
    expect(events).toEqual(["capture", "false"]);
  });
});

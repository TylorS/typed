import {
  createContext,
  createElement,
  Fragment,
  forwardRef,
  lazy,
  memo,
  StrictMode,
  useContext,
  useId,
} from "react";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { html } from "@typed/template";
import { renderToHtmlString } from "./native.js";
import { view } from "../view.js";

function Field({ label }: { label: string }) {
  const id = useId();
  return createElement("label", { htmlFor: id }, label, createElement("input", { id }));
}

describe("automatic React root identity", () => {
  it("allocates unique hosts and useId prefixes for each execution of the same view", async () => {
    const island = view(Field, { label: "Name" });
    const app = html`${island}${island}`;
    const [first, second] = await Promise.all([
      Effect.runPromise(renderToHtmlString(app)),
      Effect.runPromise(renderToHtmlString(app)),
    ]);
    const ids = [...(first + second).matchAll(/<div[^>]*\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(first + second).toContain(`_${id}`);
  });

  it("accepts nodes and exotic components with omitted options, and preserves explicit IDs", async () => {
    const Forwarded = forwardRef<HTMLInputElement, { label: string }>((props, ref) =>
      createElement("input", { ref, "aria-label": props.label }),
    );
    const DeferredField = lazy(async () => ({ default: Field }));
    const result = await Effect.runPromise(
      renderToHtmlString(html`
        ${view("text")}${view(memo(Field), { label: "Memo" })}
        ${view(Forwarded, { label: "Forwarded" })}${view(DeferredField, { label: "Lazy" })}
        ${view(Field, { label: "Explicit" }, { id: "explicit" })}
      `),
    );
    expect(result).toContain("text");
    expect(result).toContain("Memo");
    expect(result).toContain('aria-label="Forwarded"');
    expect(result).toContain("Lazy");
    expect(result).toContain('id="explicit"');
  });

  it("accepts symbolic components and context providers with and without options", async () => {
    const Label = createContext("missing");
    const ReadLabel = () => createElement("b", null, useContext(Label));
    const output = await Effect.runPromise(
      renderToHtmlString(html`
        ${view(Fragment, { children: "fragment" }, { id: "fragment-host" })}
        ${view(StrictMode, { children: "strict" })}
        ${view(Label.Provider, { value: "provided", children: createElement(ReadLabel) })}
      `),
    );
    expect(output).toContain('id="fragment-host"');
    expect(output).toContain("fragment");
    expect(output).toContain("strict");
    expect(output).toContain("<b>provided</b>");
  });
});

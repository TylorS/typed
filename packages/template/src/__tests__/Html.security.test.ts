import { describe, expect, it } from "vitest";
import { Cause, Effect, Option } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html, HtmlRenderEvent, MANY_HOLE, many } from "../index.js";
import { getInteractiveHtml, getStaticHtml } from "./helpers/html-output.js";

const imagePayload =
  '<img id="ordinary-xss" src="/__typed_ts01_missing__.png" onerror="globalThis.__typedTs01Executed = true">';
const escapedImage =
  "&lt;img id=&quot;ordinary-xss&quot; src=&quot;/__typed_ts01_missing__.png&quot; onerror=&quot;globalThis.__typedTs01Executed = true&quot;&gt;";

const stringCases = [
  {
    name: "markup and event attributes",
    payload: imagePayload,
    escaped: escapedImage,
    forbidden: '<img id="ordinary-xss"',
  },
  {
    name: "a script element",
    payload: '<script id="ordinary-script">globalThis.__typedTs01Executed = true</script>',
    escaped:
      "&lt;script id=&quot;ordinary-script&quot;&gt;globalThis.__typedTs01Executed = true&lt;/script&gt;",
    forbidden: '<script id="ordinary-script"',
  },
  {
    name: "a closing script sequence",
    payload: '</script><script id="ordinary-breakout">alert(1)</script>',
    escaped:
      "&lt;/script&gt;&lt;script id=&quot;ordinary-breakout&quot;&gt;alert(1)&lt;/script&gt;",
    forbidden: '<script id="ordinary-breakout"',
  },
  {
    name: "HTML punctuation",
    payload: `<>&"'`,
    escaped: "&lt;&gt;&amp;&quot;&#39;",
    forbidden: `<>&"'`,
  },
] as const;

describe("TS-01 ordinary SSR child escaping", () => {
  it.each(stringCases)(
    "escapes $name in static and interactive SSR",
    ({ payload, escaped, forbidden }) =>
      Effect.gen(function* () {
        const staticHtml = yield* getStaticHtml(html`<div>${payload}</div>`);
        const interactiveHtml = yield* getInteractiveHtml(html`<div>${payload}</div>`);

        expect(staticHtml).toBe(`<div>${escaped}</div>`);
        expect(interactiveHtml).toContain(`<!--n_0-->${escaped}<!--/n_0-->`);
        expect(interactiveHtml).not.toContain(forbidden);
      }).pipe(Effect.scoped, Effect.runPromise),
  );

  it("escapes every ordinary value in a nested array", () =>
    Effect.gen(function* () {
      const value = [imagePayload, [" | ", imagePayload]];
      const expected = `${escapedImage} | ${escapedImage}`;

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(`<div>${expected}</div>`);
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        `<!--n_0-->${expected}<!--/n_0-->`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("escapes Option.some and renders Option.none as empty content", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>${Option.some(imagePayload)}</div>`)).toBe(
        `<div>${escapedImage}</div>`,
      );
      expect(yield* getInteractiveHtml(html`<div>${Option.some(imagePayload)}</div>`)).toContain(
        `<!--n_0-->${escapedImage}<!--/n_0-->`,
      );
      expect(yield* getStaticHtml(html`<div>${Option.none()}</div>`)).toBe("<div></div>");
      expect(yield* getInteractiveHtml(html`<div>${Option.none()}</div>`)).toContain(
        "<!--n_0--><!--/n_0-->",
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("escapes an ordinary Effect value", () =>
    Effect.gen(function* () {
      const value = Effect.succeed(imagePayload);

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(`<div>${escapedImage}</div>`);
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        `<!--n_0-->${escapedImage}<!--/n_0-->`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("escapes the first ordinary Fx value", () =>
    Effect.gen(function* () {
      const value = Fx.mergeOrdered(Fx.succeed(imagePayload), Fx.succeed("ignored"));

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(`<div>${escapedImage}</div>`);
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        `<!--n_0-->${escapedImage}<!--/n_0-->`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("escapes an ordinary record and all HTML punctuation in it", () =>
    Effect.gen(function* () {
      const value = { message: `<>&"'`, safe: "ok" };
      const expected =
        "{&quot;message&quot;:&quot;&lt;&gt;&amp;\\&quot;&#39;&quot;,&quot;safe&quot;:&quot;ok&quot;}";

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(`<div>${expected}</div>`);
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        `<!--n_0-->${expected}<!--/n_0-->`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves nested-template markup transport", () =>
    Effect.gen(function* () {
      const value = html`<em id="nested-template">nested template</em>`;

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(
        '<div><em id="nested-template">nested template</em></div>',
      );
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        '<em id="nested-template">nested template</em>',
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves explicit HtmlRenderEvent transport", () =>
    Effect.gen(function* () {
      const value = HtmlRenderEvent('<strong id="transport">renderer-owned</strong>', true);

      expect(yield* getStaticHtml(html`<div>${value}</div>`)).toBe(
        '<div><strong id="transport">renderer-owned</strong></div>',
      );
      expect(yield* getInteractiveHtml(html`<div>${value}</div>`)).toContain(
        '<strong id="transport">renderer-owned</strong>',
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("rejects forged HtmlRenderEvent objects without renderer transport branding", () =>
    Effect.gen(function* () {
      const forged = {
        html: '<img id="forged" src=x onerror="alert(1)">',
        last: true,
        toString: () => '<img id="forged" src=x onerror="alert(1)">',
        valueOf: () => '<img id="forged" src=x onerror="alert(1)">',
        [Symbol.for("@typed/template/RenderEvent")]: "html",
      };

      expect(yield* getStaticHtml(html`<div>${forged}</div>`)).toBe("<div></div>");
      expect(yield* getStaticHtml(html`<div>${forged}</div>`)).not.toContain("forged");
    }).pipe(Effect.scoped, Effect.runPromise));
});

const textOnlyCases = [
  ["textarea", "TeXtArEa"],
  ["title", "TiTlE"],
  ["script", "ScRiPt"],
  ["style", "StYlE"],
  ["xmp", "XmP"],
] as const;

describe("TS-05 text-only SSR contexts", () => {
  it.each(textOnlyCases)("neutralizes a mixed-case </%s sequence", (tagName, closingName) =>
    Effect.gen(function* () {
      const payload = `</${closingName}><img id="${tagName}-xss" src=x onerror="alert(1)">`;
      const template = html(
        [`<${tagName}>`, `</${tagName}>`] as unknown as TemplateStringsArray,
        payload,
      );
      const staticHtml = yield* getStaticHtml(template);
      const interactiveHtml = yield* getInteractiveHtml(template);

      expect(staticHtml).not.toContain(`</${closingName}>`);
      expect(interactiveHtml).not.toContain(`</${closingName}>`);
    }).pipe(Effect.scoped, Effect.runPromise),
  );

  it("rejects plaintext because HTML cannot close or hydrate it", async () => {
    const template = html`<plaintext>${"content"}</plaintext>`;

    await expect(Effect.runPromise(Effect.scoped(getStaticHtml(template)))).rejects.toThrow(
      "<plaintext> templates cannot be rendered or hydrated",
    );
  });
});

describe("TS-03 SSR spread and data key policy", () => {
  it("filters unsafe names supplied by forged hydration metadata", () =>
    Effect.gen(function* () {
      const hydration: RefSubject.HydrationRef = Object.assign(() => Effect.void, {
        [RefSubject.HydrationRefTypeId]: {
          members: [],
          server: Effect.void,
          toAttributes: Effect.succeed([
            { name: "data-safe", value: "ok" },
            { name: 'x" onclick="alert(1)', value: "unsafe" },
          ]),
        },
      });

      const output = yield* getInteractiveHtml(html`<div ref=${hydration}></div>`);

      expect(output).toContain('data-safe="ok"');
      expect(output).not.toContain("onclick");
      expect(output).not.toContain("unsafe");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("classifies spread keys and omits event, ref, dangerous, and invalid names", () =>
    Effect.gen(function* () {
      const props: Record<string, string | boolean> = Object.fromEntries([
        ["id", "safe"],
        ["onclick", "alert(1)"],
        ["OnMouseOver", "alert(2)"],
        ["@focus", "alert(3)"],
        ["?onload", true],
        [".innerHTML", "attacker-markup"],
        ["ref", "attacker-ref"],
        ['x" onpointerenter="alert(4)', "value"],
        ["__proto__", "attacker-prototype"],
        ["constructor", "attacker-constructor"],
      ]);

      const output = yield* getStaticHtml(html`<div ...${props}></div>`);

      expect(output).toContain('id="safe"');
      expect(output).not.toMatch(/\son[a-z]+=/i);
      expect(output).not.toContain("@focus");
      expect(output).not.toContain(" onload");
      expect(output).not.toContain("innerHTML");
      expect(output).not.toContain("attacker-ref");
      expect(output).not.toContain("onpointerenter");
      expect(output).not.toContain("__proto__");
      expect(output).not.toContain("constructor");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not evaluate effects attached to non-serializable spread keys", () =>
    Effect.gen(function* () {
      let executions = 0;
      const sideEffect = Effect.sync(() => executions++);

      const output = yield* getStaticHtml(
        html`<button
          ...${{
            id: "safe",
            onclick: sideEffect,
            "@focus": sideEffect,
            ".value": sideEffect,
            constructor: sideEffect,
          }}
        >
          Save
        </button>`,
      );

      expect(output).toContain('id="safe"');
      expect(executions).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("omits invalid and prototype-sensitive data keys without dropping safe data", () =>
    Effect.gen(function* () {
      const data = Object.fromEntries([
        ["safe-key", "safe-value"],
        ['x" onpointerenter="alert(5)', "value"],
        ["prototype", "attacker-prototype"],
      ]);

      const view = html`<div .data=${data}></div>`;
      const outputs = [yield* getStaticHtml(view), yield* getInteractiveHtml(view)];

      for (const output of outputs) {
        expect(output).toContain('data-safe-key="safe-value"');
        expect(output).not.toContain("onpointerenter");
        expect(output).not.toContain("prototype");
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("applies the same key policy to reactive spreads", () =>
    Effect.gen(function* () {
      const props = Fx.succeed({ id: "reactive-safe", onclick: "alert(1)" });
      const output = yield* getInteractiveHtml(html`<div ...${props}></div>`);

      expect(output).toContain('id="reactive-safe"');
      expect(output).not.toMatch(/\son[a-z]+=/i);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("omits cyclic nested .props without overflowing the stack", () =>
    Effect.gen(function* () {
      const props: Record<string, unknown> = {};
      props.id = "safe";
      props[".props"] = props;

      const outputs = [
        yield* getStaticHtml(html`<div ...${props}></div>`),
        yield* getInteractiveHtml(html`<div ...${props}></div>`),
      ];

      for (const output of outputs) {
        expect(output).toContain('id="safe"');
        expect(output).not.toContain(".props");
      }
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("TS-04 many hydration markers", () => {
  it("preserves MANY_HOLE's legacy public output", () => {
    expect(MANY_HOLE("legacy-key")).toBe("<!--/m_legacy-key-->");
  });

  it("encodes attacker-controlled keys into a versioned comment-safe token", () =>
    Effect.gen(function* () {
      const key = '--><img id="many-xss" src=x onerror="alert(1)"><!--';
      const view = html`<ul>
        ${many(
          Fx.succeed([{ key }]),
          (item) => item.key,
          () => html`<li>item</li>`,
        )}
      </ul>`;
      const staticHtml = yield* getStaticHtml(view);
      const interactiveHtml = yield* getInteractiveHtml(view);

      expect(staticHtml).toMatch(/<!--\/m_v1_s\.[A-Za-z0-9_-]+-->/);
      expect(interactiveHtml).toMatch(/<!--\/m_v1_s\.[A-Za-z0-9_-]+-->/);
      expect(staticHtml).not.toContain('<img id="many-xss"');
      expect(interactiveHtml).not.toContain('<img id="many-xss"');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps numeric and string keys distinct", () =>
    Effect.gen(function* () {
      const output = yield* getStaticHtml(
        html`<ul>
          ${many(
            Fx.succeed([1, "1"]),
            (value) => value,
            (_value, key) => html`<li>${typeof key}</li>`,
          )}
        </ul>`,
      );
      const markers = [...output.matchAll(/<!--\/m_v1_([^>]+)-->/g)].map((match) => match[1]);

      expect(markers).toHaveLength(2);
      expect(new Set(markers).size).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps distinct lone UTF-16 surrogates distinct", () =>
    Effect.gen(function* () {
      const output = yield* getStaticHtml(
        html`<ul>
          ${many(
            Fx.succeed(["\ud800", "\ud801"]),
            (value) => value,
            () => html`<li>item</li>`,
          )}
        </ul>`,
      );
      const markers = [...output.matchAll(/<!--\/m_v1_s\.([^>]+)-->/g)].map((match) => match[1]);

      expect(markers).toHaveLength(2);
      expect(new Set(markers).size).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("rejects duplicate keys before rendering HTML", () =>
    Effect.gen(function* () {
      const view = html`<ul>
        ${many(
          Fx.succeed(["duplicate", "duplicate"]),
          (value) => value,
          () => html`<li>item</li>`,
        )}
      </ul>`;
      const staticError = yield* Effect.flip(getStaticHtml(view));
      const interactiveError = yield* Effect.flip(getInteractiveHtml(view));

      expect(Cause.isIllegalArgumentError(staticError)).toBe(true);
      expect(Cause.isIllegalArgumentError(interactiveError)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("rejects local symbols because their identity cannot survive hydration", () =>
    Effect.gen(function* () {
      const view = html`<ul>
        ${many(
          Fx.succeed([Symbol("--><img id=local-symbol-xss>")]),
          (value) => value,
          () => html`<li>item</li>`,
        )}
      </ul>`;
      const staticError = yield* Effect.flip(getStaticHtml(view));
      const interactiveError = yield* Effect.flip(getInteractiveHtml(view));

      expect(Cause.isIllegalArgumentError(staticError)).toBe(true);
      expect(Cause.isIllegalArgumentError(interactiveError)).toBe(true);
      expect(staticError.message).toContain("Local symbol keys cannot be hydrated");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves globally registered symbols with comment-safe markers", () =>
    Effect.gen(function* () {
      const output = yield* getStaticHtml(html`<ul>
        ${many(
          Fx.succeed([Symbol.for("same-a"), Symbol.for("same-b")]),
          (value) => value,
          () => html`<li>item</li>`,
        )}
      </ul>`);
      const markers = [...output.matchAll(/<!--\/m_v1_g\.([^>]+)-->/g)].map((match) => match[1]);

      expect(markers).toHaveLength(2);
      expect(new Set(markers).size).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));
});

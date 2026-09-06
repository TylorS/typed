import type * as Template from "./Template.js";
import * as Array from "effect/Array";
import { constVoid } from "effect/Function";
import * as Order from "effect/Order";
import { isNullish, isObject } from "effect/Predicate";
import { renderToEscapedString, renderToString } from "./internal/encoding.js";
import { keyToPartType } from "./internal/keyToPartType.js";
import { TEMPLATE_END_COMMENT, TEMPLATE_START_COMMENT } from "./internal/meta.js";

/**
 * Represents a piece of a pre-compiled HTML template.
 *
 * Chunks allow the renderer to stream static parts of the HTML immediately
 * while waiting for dynamic parts to be resolved.
 *
 * @remarks
 * ## Why
 *
 * Chunks separate immediately writable author markup from dynamic work, which
 * lets the HTML renderer preserve template order while remaining push-based.
 *
 * ## Ownership and lifetime
 *
 * Chunks are immutable rendering descriptions. The Fx that evaluates them owns
 * subscriptions; the response sink owns emitted strings.
 *
 * @example
 * ```ts
 * import type { HtmlChunk } from "@typed/template/HtmlChunk"
 * import { templateToHtmlChunks } from "@typed/template/HtmlChunk"
 * import { parse } from "@typed/template/Parser"
 *
 * const template = parse(["<div>Hello ", "</div>"])
 * const chunks = templateToHtmlChunks(template)
 *
 * // chunks will contain:
 * // - HtmlTextChunk with text "<div>Hello "
 * // - HtmlPartChunk for the dynamic part
 * // - HtmlTextChunk with text "</div>"
 * ```
 *
 * @since 1.0.0
 * @category HTML chunk protocol
 */
export type HtmlChunk = HtmlTextChunk | HtmlPartChunk | HtmlSparsePartChunk;

/**
 * A static text chunk.
 *
 * @remarks
 * ## Why
 *
 * Contiguous static markup can be written without waiting for an interpolation.
 *
 * ## Ownership and lifetime
 *
 * The record retains one renderer-authored string and owns no resource.
 *
 * @example
 * ```ts
 * import type { HtmlTextChunk } from "@typed/template/HtmlChunk"
 *
 * const chunk: HtmlTextChunk = { _tag: "text", text: "<p>ready</p>" }
 * ```
 *
 * @since 1.0.0
 * @category Static HTML chunks
 */
export interface HtmlTextChunk {
  /**
   * Identifies an immediately writable static-text chunk.
   *
   * @remarks
   * ## Why
   *
   * Exhaustive dispatch avoids inspecting arbitrary object shapes.
   *
   * ## Ownership and lifetime
   *
   * The literal is immutable metadata.
   *
   * @since 1.0.0
   * @category Static HTML chunks
   */
  readonly _tag: "text";
  /**
   * Renderer-authored HTML text ready for the output sink.
   *
   * @remarks
   * ## Why
   *
   * Static markup can stream without awaiting dynamic inputs.
   *
   * ## Ownership and lifetime
   *
   * The chunk owns the string; the response sink owns emitted bytes.
   *
   * @since 1.0.0
   * @category Static HTML chunks
   */
  readonly text: string;
}

/**
 * A chunk representing a dynamic part (interpolation).
 *
 * @remarks
 * ## Why
 *
 * The parsed part and its context-aware serializer stay together, avoiding a
 * generic raw-HTML interpolation path.
 *
 * ## Ownership and lifetime
 *
 * The record borrows the parsed node and pure serializer; evaluation belongs to
 * the HTML-rendering Fx.
 *
 * @example
 * ```ts
 * import { templateToHtmlChunks, type HtmlPartChunk } from "@typed/template/HtmlChunk"
 * import { parse } from "@typed/template/Parser"
 *
 * const chunk = templateToHtmlChunks(parse(["<p>", "</p>"]))[1] as HtmlPartChunk
 * ```
 *
 * @since 1.0.0
 * @category Dynamic HTML chunks
 */
export interface HtmlPartChunk {
  /** Identifies a single dynamic part chunk.
   *
   * @remarks
   * ## Why
   * Enables exhaustive renderer dispatch.
   *
   * ## Ownership and lifetime
   * Immutable metadata owned by the chunk.
   *
   * @since 1.0.0
   * @category Dynamic HTML chunks
   */
  readonly _tag: "part";
  /** The parsed dynamic part whose index selects the input value.
   *
   * @remarks
   * ## Why
   * Preserves the exact HTML context for serialization.
   *
   * ## Ownership and lifetime
   * The chunk borrows the immutable AST node.
   *
   * @since 1.0.0
   * @category Dynamic HTML chunks
   */
  readonly node: Template.PartNode;
  /**
   * Function to render the value of this part into a string.
   *
   * @remarks
   * ## Why
   *
   * Each part keeps its context-specific escaping function.
   *
   * ## Ownership and lifetime
   *
   * The pure function retains no application value between calls.
   *
   * @since 1.0.0
   * @category Dynamic HTML chunks
   */
  readonly render: (value: unknown) => string;
}

/**
 * A chunk representing a sparse part (mixed static/dynamic text).
 *
 * @remarks
 * ## Why
 *
 * Sparse values preserve surrounding literal text while serializing each
 * interpolation according to its HTML context.
 *
 * ## Ownership and lifetime
 *
 * The record owns no subscription; the consuming renderer evaluates it.
 *
 * @example
 * ```ts
 * import { templateToHtmlChunks, type HtmlSparsePartChunk } from "@typed/template/HtmlChunk"
 * import { parse } from "@typed/template/Parser"
 *
 * const chunk = templateToHtmlChunks(parse(["<p title=\"before ", " after\"></p>"]))[1] as HtmlSparsePartChunk
 * ```
 *
 * @since 1.0.0
 * @category Sparse HTML chunks
 */
export interface HtmlSparsePartChunk {
  /** Identifies a sparse dynamic chunk.
   *
   * @remarks
   * ## Why
   * Enables exhaustive renderer dispatch.
   *
   * ## Ownership and lifetime
   * Immutable metadata owned by the chunk.
   *
   * @since 1.0.0
   * @category Sparse HTML chunks
   */
  readonly _tag: "sparse-part";
  /** The parsed sparse part retaining literal/dynamic ordering.
   *
   * @remarks
   * ## Why
   * Preserves the serialization context across all segments.
   *
   * ## Ownership and lifetime
   * The chunk borrows the immutable AST node.
   *
   * @since 1.0.0
   * @category Sparse HTML chunks
   */
  readonly node: Template.SparsePartNode;
  /**
   * Function to render the value of this part into a string.
   *
   * @remarks
   * ## Why
   *
   * Sparse parts retain one context-aware escaping boundary.
   *
   * ## Ownership and lifetime
   *
   * The pure function retains no application value between calls.
   *
   * @since 1.0.0
   * @category Sparse HTML chunks
   */
  readonly render: (value: unknown) => string;
}

/**
 * Advanced mutable builder used by the published template-to-chunk compiler.
 *
 * @remarks
 * ## Why
 *
 * Adjacent static strings are coalesced during compilation so runtime streaming
 * performs fewer writes. This is published renderer-author infrastructure, not
 * a raw-HTML application API.
 *
 * ## Ownership and lifetime
 *
 * One builder exclusively owns its mutable buffer. `build` transfers the
 * current array and resets the builder for reuse; it acquires no Scope.
 *
 * @example
 * ```ts
 * import { HtmlChunksBuilder } from "@typed/template/HtmlChunk"
 *
 * const chunks = new HtmlChunksBuilder().text("<p>hello</p>").build()
 * ```
 *
 * @since 1.0.0
 * @category HTML chunk assembly
 * @stability internal-but-published
 */
export class HtmlChunksBuilder {
  private chunks: Array<HtmlChunk> = [];

  /** Appends static text and coalesces it with the preceding text chunk.
   *
   * @remarks
   * ## Why
   * Coalescing reduces output writes before runtime rendering begins.
   *
   * ## Ownership and lifetime
   * Mutates only this builder's private buffer.
   *
   * @since 1.0.0
   * @category HTML chunk assembly
   */
  text(text: string): HtmlChunksBuilder {
    const lastIndex = this.chunks.length - 1;
    const lastChunk = this.chunks[lastIndex];
    if (lastChunk?._tag === "text") {
      this.chunks[lastIndex] = { _tag: "text", text: lastChunk.text + text };
    } else {
      this.chunks.push({ _tag: "text", text });
    }
    return this;
  }

  /** Appends one dynamic part and its context-specific serializer.
   *
   * @remarks
   * ## Why
   * Keeps escaping behavior adjacent to the parsed part.
   *
   * ## Ownership and lifetime
   * Retains the node and pure function until `build` transfers the buffer.
   *
   * @since 1.0.0
   * @category HTML chunk assembly
   */
  part(node: Template.PartNode, render: (value: unknown) => string): HtmlChunksBuilder {
    this.chunks.push({ _tag: "part", node, render });
    return this;
  }

  /** Appends one sparse dynamic part and serializer.
   *
   * @remarks
   * ## Why
   * Preserves literal/dynamic ordering under one escaping context.
   *
   * ## Ownership and lifetime
   * Retains the node and function until `build` transfers the buffer.
   *
   * @since 1.0.0
   * @category HTML chunk assembly
   */
  sparsePart(node: Template.SparsePartNode, render: (value: unknown) => string): HtmlChunksBuilder {
    this.chunks.push({ _tag: "sparse-part", node, render });
    return this;
  }

  /** Transfers the accumulated chunks and resets the builder.
   *
   * @remarks
   * ## Why
   * Allows one compiler-local builder to create independent chunk arrays.
   *
   * ## Ownership and lifetime
   * The caller receives the prior array; the builder starts a new empty buffer.
   *
   * @since 1.0.0
   * @category HTML chunk assembly
   */
  build(): ReadonlyArray<HtmlChunk> {
    const chunks = this.chunks;
    this.chunks = [];
    return chunks;
  }
}

// TODO: Add support for unsafe HTML content.

/**
 * Converts a parsed `Template` into a sequence of `HtmlChunk`s.
 * This optimization pre-calculates the static HTML strings to minimize work at render time.
 *
 * @remarks
 * ## Why
 *
 * Compiling the parsed AST once exposes static output immediately and assigns a
 * context-specific serializer to each dynamic part.
 *
 * ## Ownership and lifetime
 *
 * The returned chunks retain the parsed nodes but own no reactive input. A
 * `RenderTemplate` layer may cache them by template-literal identity.
 *
 * ## Trust boundary
 *
 * Dynamic serializers escape data for node, attribute, comment, and text-only
 * contexts; renderer-owned HTML transport remains a separate brand.
 *
 * @example
 * ```ts
 * import { templateToHtmlChunks } from "@typed/template/HtmlChunk"
 * import { parse } from "@typed/template/Parser"
 *
 * const template = parse(["<div class=\"container\">Hello ", "</div>"])
 * const chunks = templateToHtmlChunks(template)
 *
 * // chunks is an array of HtmlChunk objects
 * // Static parts are pre-rendered as text chunks
 * // Dynamic parts are represented as part chunks
 * ```
 *
 * @since 1.0.0
 * @category HTML compilation
 */
export function templateToHtmlChunks({ nodes }: Template.Template) {
  const builder = new HtmlChunksBuilder();
  for (const node of nodes) nodeToHtmlChunk(builder, node);
  return builder.build();
}

/**
 * Wraps the HTML chunks with comments containing the template hash.
 * This is crucial for hydration to identify which template rendered a section of HTML.
 *
 * @remarks
 * ## Why
 *
 * Versioned boundary comments let the DOM renderer locate the exact SSR range
 * corresponding to a compiled template without claiming unrelated nodes.
 *
 * ## Ownership and lifetime
 *
 * This pure transformation returns a new chunk sequence. Marker adoption and
 * fallback are owned later by the hydration Scope.
 *
 * @example
 * ```ts
 * import { addTemplateHash, templateToHtmlChunks } from "@typed/template/HtmlChunk"
 * import { parse } from "@typed/template/Parser"
 *
 * const template = parse(["<div>Hello</div>"])
 * const chunks = templateToHtmlChunks(template)
 * const chunksWithHash = addTemplateHash(chunks, template)
 *
 * // chunksWithHash will have template hash comments added
 * // for hydration purposes
 * ```
 *
 * @since 1.0.0
 * @category Hydration markers
 */
export function addTemplateHash(
  chunks: ReadonlyArray<HtmlChunk>,
  { hash }: Template.Template,
): ReadonlyArray<HtmlChunk> {
  const start = TEMPLATE_START_COMMENT(hash);
  const end = TEMPLATE_END_COMMENT(hash);
  if (chunks.length === 0) return [{ _tag: "text", text: start + end }];
  return appendTextChunk(prependTextChunk(chunks, start), end);
}

function prependTextChunk(
  chunks: ReadonlyArray<HtmlChunk>,
  text: string,
): ReadonlyArray<HtmlChunk> {
  if (chunks.length === 0) return [{ _tag: "text", text }];
  const firstChunk = chunks[0];
  if (firstChunk._tag === "text")
    return [{ _tag: "text", text: text + firstChunk.text }, ...chunks.slice(1)];
  return [{ _tag: "text", text }, ...chunks];
}

function appendTextChunk(chunks: ReadonlyArray<HtmlChunk>, text: string): ReadonlyArray<HtmlChunk> {
  if (chunks.length === 0) return [{ _tag: "text", text }];
  const lastChunk = chunks[chunks.length - 1];
  if (lastChunk._tag === "text")
    return [...chunks.slice(0, -1), { _tag: "text", text: lastChunk.text + text }];
  return [...chunks, { _tag: "text", text }];
}

type NodeMap = {
  readonly [K in Template.Node["_tag"]]: (
    builder: HtmlChunksBuilder,
    node: Extract<Template.Node, { _tag: K }>,
  ) => void;
};

const nodeMap: NodeMap = {
  doctype: (builder, node) => builder.text(`<!DOCTYPE ${node.name}>`),
  element: elementToHtmlChunks,
  text: (builder, node) => builder.text(node.value),
  node: (builder, part) => builder.part(part, (v) => renderToEscapedString(v, "")),
  "self-closing-element": selfClosingElementToHtmlChunks,
  "text-only-element": textOnlyElementToHtmlChunks,
  comment: (builder, node) => builder.text(`<!--${node.value}-->`),
  "comment-part": (builder, part) =>
    builder.part(part, (v) => `<!--${renderToEscapedString(v, "")}-->`),
  "sparse-comment": (builder, part) =>
    builder.sparsePart(part, (v) => `<!--${renderToEscapedString(v, "")}-->`),
};

function selfClosingElementToHtmlChunks(
  builder: HtmlChunksBuilder,
  node: Template.SelfClosingElementNode,
) {
  builder.text(`<${node.tagName}`);
  addAttributes(builder, node.attributes);
  builder.text(`/>`);
}

function textOnlyElementToHtmlChunks(builder: HtmlChunksBuilder, node: Template.TextOnlyElement) {
  builder.text(`<${node.tagName}`);
  addAttributes(builder, node.attributes);
  builder.text(">");
  if (node.textContent !== null) {
    textContentToHtml(builder, node.tagName, node.textContent);
  }

  builder.text(`</${node.tagName}>`);
}

function textContentToHtml(
  builder: HtmlChunksBuilder,
  tagName: string,
  textContent: Template.Text,
) {
  switch (textContent._tag) {
    case "text":
      return builder.text(textContent.value);
    case "text-part":
      return builder.part(textContent, (v) => renderTextOnlyValue(tagName, v));
    case "sparse-text":
      return builder.sparsePart(textContent, (v) => renderTextOnlyValue(tagName, v));
  }
}

function nodeToHtmlChunk(builder: HtmlChunksBuilder, node: Template.Node) {
  const handler = nodeMap[node._tag];
  handler(builder, node as never);
}

function elementToHtmlChunks(
  builder: HtmlChunksBuilder,
  { attributes, children, tagName }: Template.ElementNode,
) {
  builder.text(`<${tagName}`);
  addAttributes(builder, attributes);
  builder.text(">");
  for (const child of children) nodeToHtmlChunk(builder, child);
  builder.text(`</${tagName}>`);
}

function addAttributes(builder: HtmlChunksBuilder, attributes: ReadonlyArray<Template.Attribute>) {
  if (attributes.length > 0) {
    const lastIndex = attributes.length - 1;
    for (const [index, attribute] of sortAttributes(attributes).entries()) {
      attributeToHtmlChunk(builder, attribute, {
        isFirst: index === 0,
        isLast: index === lastIndex,
      });
    }
  }
}

type Placement = {
  readonly isFirst: boolean;
  readonly isLast: boolean;
};

type AttributeMap = {
  readonly [K in Template.Attribute["_tag"]]: (
    builder: HtmlChunksBuilder,
    attribute: Extract<Template.Attribute, { _tag: K }>,
    placement: Placement,
  ) => void;
};

function attributeToHtmlChunk(
  builder: HtmlChunksBuilder,
  attr: Template.Attribute,
  placement: Placement,
): void {
  attributeMap[attr._tag](builder, attr as never, placement);
}

const attributeMap: AttributeMap = {
  attribute: (builder, attribute, placement) =>
    builder.text(addAttributeSpace(`${attribute.name}="${attribute.value}"`, placement)),
  boolean: (builder, attribute, placement) =>
    builder.text(addAttributeSpace(`${attribute.name}`, placement)),
  attr: (builder, attribute, placement) =>
    builder.part(attribute, (v) =>
      addAttributeSpace(renderAttribute(attribute.name, v), placement),
    ),
  "sparse-attr": (builder, attribute, placement) =>
    builder.sparsePart(attribute, (v) =>
      addAttributeSpace(`${attribute.name}="${renderToEscapedString(v, "")}"`, placement),
    ),
  "boolean-part": (builder, attribute, placement) =>
    builder.part(attribute, (v) => addAttributeSpace(v ? `${attribute.name}` : "", placement)),
  "className-part": (builder, attribute, placement) =>
    builder.part(attribute, (v) =>
      addAttributeSpace(isNullish(v) ? "" : `class="${renderToEscapedString(v, " ")}"`, placement),
    ),
  "sparse-class-name": (builder, attribute, placement) =>
    builder.sparsePart(attribute, (v) =>
      addAttributeSpace(`class="${renderToEscapedString(v, "")}"`, placement),
    ),
  data: (builder, attribute, placement) =>
    builder.part(attribute, (v) => addAttributeSpace(renderDataAttributes(v), placement)),
  property: (builder, attribute, placement) =>
    builder.part(attribute, (v) =>
      addAttributeSpace(renderAttribute(attribute.name, v), placement),
    ),
  properties: (builder, attribute, placement) =>
    builder.part(attribute, (v) => {
      const attributes = renderSpreadAttributes(v);
      return addAttributeSpace(attributes, placement);
    }),

  ref: (builder, attribute, placement) =>
    builder.part(attribute, (v) => addAttributeSpace(renderHydrationAttributes(v), placement)),

  // Event handlers do not have an HTML representation.
  event: constVoid,
};

function addAttributeSpace(str: string, _placement: Placement) {
  if (str.length === 0) return str;
  return " " + str;
}

const AttributeOrder = Order.mapInput(
  Order.Number,
  // Order such that static attributes can be streamed out first
  // and sparse attributes can be streamed out last
  (attr: Template.Attribute) => (isStaticAttribute(attr) ? -1 : isSparseAttribute(attr) ? 1 : 0),
);

const sortAttributes = Array.sortBy(AttributeOrder);

const staticAttributes = new Set<Template.Attribute["_tag"]>(["attribute", "boolean"]);

function isStaticAttribute(attr: Template.Attribute) {
  return staticAttributes.has(attr._tag);
}

const sparseAttributes = new Set<Template.Attribute["_tag"]>(["sparse-attr", "sparse-class-name"]);

function isSparseAttribute(attr: Template.Attribute) {
  return sparseAttributes.has(attr._tag);
}

const forbiddenDynamicKeys = new Set(["__proto__", "prototype", "constructor"]);
const forbiddenAttributeNameCharacters = new Set(['"', "'", "/", ">", "=", "<"]);

function renderTextOnlyValue(tagName: string, value: unknown): string {
  switch (tagName) {
    case "textarea":
    case "title":
      return renderToEscapedString(value, "");
    case "script":
      return neutralizeClosingTag(tagName, renderToString(value, ""), "\\u003c");
    case "style":
      return neutralizeClosingTag(tagName, renderToString(value, ""), "\\3C ");
    case "xmp":
      return neutralizeClosingTag(tagName, renderToString(value, ""), "&lt;");
    default:
      return renderToEscapedString(value, "");
  }
}

function neutralizeClosingTag(tagName: string, value: string, replacement: string): string {
  const closingTagStart = new RegExp(`<(?=/${tagName}(?:[\\t\\n\\f\\r />]|$))`, "giu");
  return value.replace(closingTagStart, replacement);
}

function renderDataAttributes(value: unknown): string {
  if (!isObject(value)) return "";

  return Object.entries(value)
    .flatMap(([key, entry]) => {
      if (!isSafeDynamicKey(key)) return [];
      const name = `data-${key}`;
      if (!isValidAttributeName(name)) return [];
      return [renderAttribute(name, entry)];
    })
    .join(" ");
}

function renderHydrationAttributes(value: unknown): string {
  if (!globalThis.Array.isArray(value)) return "";

  return value
    .flatMap((entry) => {
      if (!isObject(entry)) return [];
      const { name, value } = entry as Record<string, unknown>;
      if (
        typeof name !== "string" ||
        typeof value !== "string" ||
        !isSerializableAttributeName(name)
      ) {
        return [];
      }
      return [renderAttribute(name, value)];
    })
    .join(" ");
}

function renderSpreadAttributes(value: unknown, ancestors = new Set<object>()): string {
  if (!isObject(value)) return "";
  if (ancestors.has(value)) return "";
  ancestors.add(value);

  try {
    return Object.entries(value)
      .flatMap(([key, entry]) => {
        if (!isSerializableSpreadKey(key)) return [];

        const [kind, name] = keyToPartType(key);
        switch (kind) {
          case "event":
          case "property":
          case "ref":
            return [];
          case "boolean":
            return entry && isSerializableAttributeName(name) ? [name] : [];
          case "class":
            return [renderAttribute("class", entry)];
          case "data": {
            const attributes = renderDataAttributes(entry);
            return attributes === "" ? [] : [attributes];
          }
          case "properties": {
            const attributes = renderSpreadAttributes(entry, ancestors);
            return attributes === "" ? [] : [attributes];
          }
          case "attr":
            return isSerializableAttributeName(name) ? [renderAttribute(name, entry)] : [];
        }
      })
      .join(" ");
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Reports whether a dynamic spread key may be serialized into SSR HTML.
 *
 * @remarks
 * ## Why
 *
 * DOM properties, event handlers, refs, `on*` attributes, invalid names, and
 * prototype-sensitive keys are not HTML attributes. Rejecting them here keeps
 * server output aligned with the web platform and avoids treating object data
 * as trusted markup.
 *
 * ## Ownership and lifetime
 *
 * This pure predicate retains neither the key nor any application value.
 *
 * @example
 * ```ts
 * import { isSerializableSpreadKey } from "@typed/template/HtmlChunk"
 *
 * isSerializableSpreadKey("aria-label") // true
 * isSerializableSpreadKey("onclick") // false
 * ```
 *
 * @since 1.0.0
 * @category Spread serialization
 */
export function isSerializableSpreadKey(key: string): boolean {
  if (!isSafeDynamicKey(key) || /^on/i.test(key)) return false;

  const [kind, name] = keyToPartType(key);
  switch (kind) {
    case "event":
    case "property":
    case "ref":
      return false;
    case "boolean":
    case "attr":
      return isSerializableAttributeName(name);
    case "class":
    case "data":
    case "properties":
      return true;
  }
}

function isSafeDynamicKey(key: string): boolean {
  return !forbiddenDynamicKeys.has(key);
}

function isValidAttributeName(name: string): boolean {
  if (name.length === 0) return false;
  for (const character of name) {
    const codePoint = character.codePointAt(0)!;
    if (
      codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      forbiddenAttributeNameCharacters.has(character)
    ) {
      return false;
    }
  }
  return true;
}

function isSerializableAttributeName(name: string): boolean {
  return isValidAttributeName(name) && !/^on/i.test(name);
}

function renderAttribute(name: string, value: unknown): string {
  return isNullish(value) ? "" : `${name}="${renderToEscapedString(value, "")}"`;
}

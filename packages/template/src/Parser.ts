/* eslint-disable no-restricted-syntax */

import {
  TokenKind as HtmlTokenKind,
  tokenize,
  type IToken,
} from "./internal/HtmlTokenizer.js";
import { keyToPartType } from "./internal/keyToPartType.js";
import { PART_STRING } from "./internal/meta.js";
import { PathStack } from "./internal/PathStack.js";
import { templateHash } from "./internal/templateHash.js";
import * as Template from "./Template.js";

let parser: Parser | undefined;
/**
 * Parses a template string array (from a tagged template literal) into a reusable `Template` object.
 *
 * This parser handles:
 * - Standard HTML structure (elements, attributes, text, comments).
 * - Custom part syntax for interpolation (e.g., `${value}`).
 * - Special attributes like `.property`, `@event`, `?boolean`.
 * - Self-closing tags and text-only elements (script, style).
 *
 * Each call returns a new `Template` instance containing the static AST and dynamic part locations.
 * Render targets cache their compiled DOM fragments or HTML chunks independently by template-literal
 * identity.
 *
 * @remarks
 * ## Why
 *
 * One renderer-neutral AST gives DOM rendering, SSR, and hydration the same
 * interpolation paths and template hash. Template syntax remains ordinary HTML
 * with explicit prefixes for properties, events, booleans, data, spreads, and
 * refs.
 *
 * ## Ownership and lifetime
 *
 * The parser reuses internal scratch storage synchronously but returns a fresh,
 * caller-owned immutable model on every call. Render layers decide whether and
 * how long to cache compiled results by template-literal identity.
 *
 * ## Errors and trust
 *
 * Malformed author templates throw parser errors during compilation. Parsing
 * does not sanitize markup; dynamic values are escaped later by the HTML
 * renderer according to the recorded part context.
 *
 * @example
 * ```ts
 * import { parse } from "@typed/template/Parser"
 *
 * // Each array boundary records one interpolation point. Runtime values are
 * // supplied later by a renderer, not passed to parse.
 * const template = parse([
 *   "<div id=\"",
 *   "\" class=\"container\"><p>Hello, ",
 *   "!</p></div>"
 * ])
 *
 * // Access parsed structure
 * console.log(template.nodes) // Array of parsed nodes
 * console.log(template.parts) // Array of dynamic interpolation points
 * console.log(template.hash) // Unique hash for the template
 * ```
 *
 * @param template - The template strings array from a tagged template literal.
 * @returns A `Template` object representing the parsed structure.
 * @since 1.0.0
 * @category Template parsing
 */
export function parse(template: ReadonlyArray<string>): Template.Template {
  parser ??= new Parser();
  return parser.parse(template);
}

class Parser {
  protected html!: string;
  protected tokens!: Array<IToken>;
  protected index!: number;
  protected parts!: Array<
    readonly [part: Template.PartNode | Template.SparsePartNode, path: Array<number>]
  >;
  protected path!: PathStack;

  parse(templateStrings: ReadonlyArray<string>): Template.Template {
    this.init(templateStrings);
    return new Template.Template(this.parseNodes(), templateHash(templateStrings), this.parts);
  }

  private init(templateStrings: ReadonlyArray<string>) {
    this.html = templateWithParts(templateStrings);
    this.tokens = tokenize(this.html);
    this.index = 0;
    this.parts = [];
    this.path = new PathStack();
  }

  private peek(): IToken | undefined {
    return this.tokens[this.index];
  }

  private consumeNextTokenOfKind(kind: HtmlTokenKind) {
    const token = this.tokens[this.index];
    if (token.type !== kind) {
      throw new Error(`Expected ${TokenKindToName[kind]} but got ${TokenKindToName[token.type]}`);
    }
    this.index++;
    return token;
  }

  private consumeWhitespace() {
    while (this.tokens[this.index]?.type === TokenKind.Whitespace) {
      this.index++;
    }
  }

  private consumeNextTokenOfKinds(...kinds: Array<HtmlTokenKind>) {
    const token = this.tokens[this.index];
    if (!kinds.includes(token.type)) {
      throw new Error(
        `Expected ${kinds.map((kind) => TokenKindToName[kind]).join(" or ")} but got ${TokenKindToName[token.type]}`,
      );
    }
    this.index++;
    return token;
  }

  private parseNodes(): Array<Template.Node> {
    const nodes: Array<Template.Node> = [];

    while (this.index < this.tokens.length) {
      const token = this.consumeNextTokenOfKinds(
        TokenKind.Literal,
        TokenKind.OpenTag,
        TokenKind.CloseTag,
        TokenKind.Whitespace,
      );

      if (token.type === TokenKind.Literal) {
        nodes.push(...this.parseNodeParts(token));
      } else if (token.type === TokenKind.OpenTag) {
        nodes.push(this.parseOpenTag(token));
        this.path.inc();
      } else if (token.type === TokenKind.CloseTag) {
        this.consumeWhitespace();
        break;
      } else if (nodes.length > 0) {
        nodes.push(new Template.TextNode(token.value));
        this.path.inc();
      }
    }

    return nodes;
  }

  private parseNodeParts(literal: IToken): Array<Template.Node> {
    return parseTextAndParts(
      literal.value,
      (index) => this.addPartWithPrevious(new Template.NodePart(index)),
      () => this.path.inc(),
    );
  }

  private parseOpenTag({ value }: IToken): Template.Node {
    if (value === "!--") return this.parseCommentNode();
    if (value === "!doctype") return this.parseDocTypeNode();
    if (SELF_CLOSING_TAGS.has(value)) return this.parseSelfClosingElementNode(value);
    if (TEXT_ONLY_NODES_REGEX.has(value)) return this.parseTextOnlyElementNode(value);
    // All other elements
    const { attributes, wasSelfClosed } = this.parseAttributes();
    const children = wasSelfClosed ? [] : this.parseChildren();
    return new Template.ElementNode(value, attributes, children);
  }

  private parseChildren() {
    this.path.push();
    const children = this.parseNodes();
    this.path.pop();
    return children;
  }

  private parseCommentNode(): Template.Node {
    const { value } = this.consumeNextTokenOfKind(TokenKind.Literal);
    this.consumeNextTokenOfKind(TokenKind.OpenTagEnd);

    return this.parseMultipleParts(
      value,
      (index) => new Template.CommentPartNode(index),
      (text) => new Template.CommentNode(text.value),
      (parts) => new Template.SparseCommentNode(parts),
    );
  }

  private parseDocTypeNode(): Template.Node {
    this.consumeWhitespace();

    // Try to parse the name
    const parsedName = this.parseLiteralLike();
    if (parsedName.closed) return new Template.DocType("html");
    const name = parsedName.value ?? "html";

    const { closed, publicId, systemId } = this.parseDocTypeIds();

    if (!closed) {
      this.consumeWhitespace();
      this.consumeNextTokenOfKind(TokenKind.OpenTagEnd);
    }

    return new Template.DocType(name, publicId, systemId);
  }

  private parseDocTypeIds(): {
    closed: boolean;
    publicId: string | undefined;
    systemId: string | undefined;
  } {
    const firstIdType = this.parseDocTypeId();
    if (firstIdType.closed) return firstIdType;
    const secondIdType = this.parseDocTypeId();
    return {
      closed: secondIdType.closed,
      publicId: secondIdType.publicId ?? firstIdType.publicId,
      systemId: secondIdType.systemId ?? firstIdType.systemId,
    };
  }

  private parseDocTypeId(): {
    closed: boolean;
    publicId: string | undefined;
    systemId: string | undefined;
  } {
    const parsedIdType = this.parseLiteralLike();

    if (parsedIdType.closed || parsedIdType.value === null) {
      return { closed: parsedIdType.closed, publicId: undefined, systemId: undefined };
    }

    const value = parsedIdType.value.toLowerCase();
    if (value === "public" || value === "system") {
      const parsedLiteral = this.parseLiteralLike();
      if (parsedLiteral.closed || parsedLiteral.value === null) {
        return { closed: parsedLiteral.closed, publicId: undefined, systemId: undefined };
      }
      return {
        closed: false,
        publicId: value === "public" ? parsedLiteral.value : undefined,
        systemId: value === "system" ? parsedLiteral.value : undefined,
      };
    }

    return { closed: false, publicId: undefined, systemId: undefined };
  }

  private parseLiteralLike(): {
    closed: boolean;
    value: string | null;
  } {
    this.consumeWhitespace();

    const { type, value } = this.consumeNextTokenOfKinds(
      TokenKind.Literal,
      TokenKind.AttrValueNq,
      TokenKind.AttrValueDq,
      TokenKind.AttrValueSq,
      TokenKind.OpenTagEnd,
    );

    if (type === TokenKind.OpenTagEnd) return { closed: true, value: null };
    if (type === TokenKind.Literal || type === TokenKind.AttrValueNq)
      return { closed: false, value };
    if (type === TokenKind.AttrValueDq || type === TokenKind.AttrValueSq) {
      return { closed: false, value: value.slice(1, -1) };
    }
    throw new Error(`Unexpected token ${TokenKindToName[type]} in place of literal`);
  }

  private parseSelfClosingElementNode(name: string): Template.Node {
    const { attributes } = this.parseAttributes();
    return new Template.SelfClosingElementNode(name, attributes);
  }

  private parseTextOnlyElementNode(name: string): Template.Node {
    if (name === "plaintext") {
      throw new TypeError("<plaintext> templates cannot be rendered or hydrated");
    }
    const { attributes, wasSelfClosed } = this.parseAttributes();
    const textContent = wasSelfClosed ? null : this.parseTextOnlyChildren();
    return new Template.TextOnlyElement(name, attributes, textContent);
  }

  private parseAttributes(): {
    attributes: Array<Template.Attribute>;
    wasSelfClosed: boolean;
  } {
    let wasSelfClosed = false;
    const attributes: Array<Template.Attribute> = [];

    this.consumeWhitespace();

    while (this.index < this.tokens.length) {
      const token = this.peek()!;

      if (token.type === TokenKind.OpenTagEnd) {
        this.index++;
        wasSelfClosed = token.value === "/";
        this.consumeWhitespace();
        break;
      }

      if (token.type === TokenKind.Whitespace) {
        this.index++;
        continue;
      }

      const { attribute, isSelfClosed, shouldContinue } = this.parseAttribute();
      attributes.push(attribute);
      wasSelfClosed ||= isSelfClosed;
      if (!shouldContinue) {
        this.consumeWhitespace();
        break;
      }
    }

    return {
      attributes,
      wasSelfClosed,
    };
  }

  private parseAttribute(): {
    shouldContinue: boolean;
    isSelfClosed: boolean;
    attribute: Template.Attribute;
  } {
    const { value: name } = this.consumeNextTokenOfKind(TokenKind.AttrValueNq);

    if (isSpreadAttribute(name)) {
      return {
        shouldContinue: true,
        isSelfClosed: false,
        attribute: this.parsePropertiesAttribute(name.slice(3)),
      };
    }

    const next = this.consumeNextTokenOfKinds(
      TokenKind.AttrValueEq,
      TokenKind.Whitespace,
      TokenKind.OpenTagEnd,
    );

    if (next.type === TokenKind.AttrValueEq) {
      const { type, value } = this.consumeNextTokenOfKinds(
        TokenKind.AttrValueDq,
        TokenKind.AttrValueSq,
        TokenKind.AttrValueNq,
      );
      return {
        shouldContinue: true,
        isSelfClosed: false,
        attribute: this.parseAttributeWithValue(
          name,
          type === TokenKind.AttrValueNq ? value : value.slice(1, -1),
        ),
      };
    } else if (next.type === TokenKind.Whitespace) {
      assertStaticAttribute(name);
      return {
        shouldContinue: true,
        isSelfClosed: false,
        attribute: new Template.BooleanNode(name),
      };
    } else if (next.type === TokenKind.OpenTagEnd) {
      assertStaticAttribute(name);
      this.consumeWhitespace();
      return {
        shouldContinue: false,
        isSelfClosed: next.value === "/",
        attribute: new Template.BooleanNode(name),
      };
    } else {
      throw new Error(`Unexpected token ${TokenKindToName[next.type]} in place of attribute`);
    }
  }

  private parseAttributeWithValue(
    rawName: string,
    value: string,
  ): Template.Attribute | Template.SparseAttrNode {
    const [match, name] = keyToPartType(rawName);
    switch (match) {
      case "attr":
        return this.parseAttributePart(value, name);
      case "boolean":
        return this.parseBooleanAttribute(value, name);
      case "class":
        return this.parseClassNameAttribute(value);
      case "data":
        return this.parseDataAttribute(value);
      case "event":
        return this.parseEventAttribute(value, name);
      case "properties":
        return this.parsePropertiesAttribute(value);
      case "property":
        return this.parsePropertyAttribute(value, name);
      case "ref":
        return this.parseRefAttribute(value);
    }
  }

  private parseAttributePart(
    value: string,
    name: string,
  ): Template.Attribute | Template.SparseAttrNode {
    return this.parseMultipleParts(
      value,
      (index) => new Template.AttrPartNode(name, index),
      (text) => new Template.AttributeNode(name, text.value),
      (parts) => new Template.SparseAttrNode(name, parts),
    );
  }

  private parseBooleanAttribute(value: string, name: string): Template.BooleanPartNode {
    return this.addPart(
      new Template.BooleanPartNode(name, parseDirectivePartIndex(value, `?${name}`)),
    );
  }

  private parseClassNameAttribute(
    value: string,
  ): Template.AttributeNode | Template.ClassNamePartNode | Template.SparseClassNameNode {
    return this.parseMultipleParts(
      value,
      (index) => new Template.ClassNamePartNode(index),
      (text) => new Template.AttributeNode("class", text.value.trim()),
      (parts) => new Template.SparseClassNameNode(parts),
    );
  }

  private parseDataAttribute(value: string): Template.AttributeNode | Template.DataPartNode {
    return this.addPart(new Template.DataPartNode(parseDirectivePartIndex(value, ".data")));
  }

  private parseEventAttribute(
    value: string,
    name: string,
  ): Template.AttributeNode | Template.EventPartNode {
    return this.addPart(new Template.EventPartNode(name, parseDirectivePartIndex(value, "event")));
  }

  private parsePropertyAttribute(
    value: string,
    name: string,
  ): Template.AttributeNode | Template.PropertyPartNode {
    return this.addPart(
      new Template.PropertyPartNode(name, parseDirectivePartIndex(value, `.${name}`)),
    );
  }

  private parsePropertiesAttribute(
    value: string,
  ): Template.AttributeNode | Template.PropertiesPartNode {
    return this.addPart(new Template.PropertiesPartNode(parseDirectivePartIndex(value, "spread")));
  }

  private parseRefAttribute(value: string): Template.AttributeNode | Template.RefPartNode {
    return this.addPart(new Template.RefPartNode(parseDirectivePartIndex(value, "ref")));
  }

  private parseTextOnlyChildren(): Template.Text | null {
    const { type, value } = this.consumeNextTokenOfKinds(TokenKind.Literal, TokenKind.CloseTag);

    if (type === TokenKind.Literal) {
      this.consumeNextTokenOfKind(TokenKind.CloseTag);
      return this.parseMultipleParts(
        value,
        (index) => new Template.TextPartNode(index),
        (text) => text,
        (parts) => new Template.SparseTextNode(parts),
      );
    }
    this.consumeWhitespace();
    return null;
  }

  private parseMultipleParts<
    T extends Template.PartNode,
    T2 extends Template.Attribute | Template.Node,
    U extends Template.SparsePartNode,
  >(
    value: string,
    createPart: (index: number) => T,
    onSingleTextNode: (text: Template.TextNode) => T2,
    onMultiParts: (parts: Array<T | Template.TextNode>) => U,
  ): T | T2 | U {
    const parts = parseTextAndParts(value, createPart);
    if (parts.length === 1) {
      if (parts[0]._tag === "text") return onSingleTextNode(parts[0]);
      return this.addPart(parts[0]);
    }
    return this.addPart(onMultiParts(parts));
  }

  private addPart<T extends Template.PartNode | Template.SparsePartNode>(part: T): T {
    this.parts.push([part, this.path.toChunk()]);
    return part;
  }

  private addPartWithPrevious<T extends Template.PartNode | Template.SparsePartNode>(part: T): T {
    this.parts.push([part, this.path.previousChunk()]);
    this.path.inc(); // Nodes will be inserted as a comment
    return part;
  }
}

const TEXT_ONLY_NODES_REGEX = new Set(["textarea", "script", "style", "title", "plaintext", "xmp"]);

const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const TokenKind = {
  /* eslint-disable @typescript-eslint/consistent-type-imports */
  Literal: HtmlTokenKind.Literal,
  OpenTag: HtmlTokenKind.OpenTag,
  OpenTagEnd: HtmlTokenKind.OpenTagEnd,
  CloseTag: HtmlTokenKind.CloseTag,
  Whitespace: HtmlTokenKind.Whitespace,
  AttrValueEq: HtmlTokenKind.AttrValueEq,
  AttrValueNq: HtmlTokenKind.AttrValueNq,
  AttrValueSq: HtmlTokenKind.AttrValueSq,
  AttrValueDq: HtmlTokenKind.AttrValueDq,
  /* eslint-enable @typescript-eslint/consistent-type-imports */
} as const;

const TokenKindToName = {
  [TokenKind.Literal]: "Literal",
  [TokenKind.OpenTag]: "OpenTag",
  [TokenKind.OpenTagEnd]: "OpenTagEnd",
  [TokenKind.CloseTag]: "CloseTag",
  [TokenKind.Whitespace]: "Whitespace",
  [TokenKind.AttrValueEq]: "AttrValueEq",
  [TokenKind.AttrValueNq]: "AttrValueNq",
  [TokenKind.AttrValueSq]: "AttrValueSq",
  [TokenKind.AttrValueDq]: "AttrValueDq",
} as const;

function templateWithParts(template: ReadonlyArray<string>): string {
  const length = template.length;
  if (length === 0) return "";

  // oxlint-disable-next-line no-new-array
  const parts: Array<string> = new Array(length + length - 1);

  let j = 0;
  for (let i = 0; i < length; i++) {
    parts[j++] = template[i];
    if (i !== length - 1) {
      parts[j++] = PART_STRING(i);
    }
  }

  return parts.join("");
}

function parseTextAndParts<T>(
  s: string,
  createPartFromIndex: (index: number) => T,
  onTextNodeInserted?: () => void,
): Array<Template.TextNode | T> {
  const out: Array<Template.TextNode | T> = [];
  let pos = 0;
  let foundAny = false;

  while (true) {
    const start = s.indexOf("{{", pos);
    if (start === -1) break;

    const end = s.indexOf("}}", start + 2);
    if (end === -1) break;

    const before = s.slice(pos, start);
    pos = end + 2;

    // Before first part: skip whitespace-only. Between parts: only skip empty.
    if (before !== "" && (foundAny || /\S/.test(before))) {
      out.push(new Template.TextNode(before));
      onTextNodeInserted?.();
    }

    foundAny = true;
    out.push(createPartFromIndex(+s.slice(start + 2, end)));
  }

  const after = s.slice(pos);
  // After last part (or entire string if no parts): skip whitespace-only
  if (after !== "" && /\S/.test(after)) {
    out.push(new Template.TextNode(after));
    onTextNodeInserted?.();
  }

  return out;
}

function parseDirectivePartIndex(text: string, name: string): number {
  if (!text.startsWith("{{") || !text.endsWith("}}")) {
    throw new TypeError(`${name} must contain exactly one interpolation`);
  }

  const index = text.slice(2, -2);
  for (let i = 0; i < index.length; i++) {
    const code = index.charCodeAt(i);
    if (code < 48 || code > 57) {
      throw new TypeError(`${name} must contain exactly one interpolation`);
    }
  }

  const partIndex = Number(index);
  if (index === "" || !Number.isSafeInteger(partIndex)) {
    throw new TypeError(`${name} must contain exactly one interpolation`);
  }
  return partIndex;
}

function assertStaticAttribute(name: string): void {
  const [partType] = keyToPartType(name);
  if (partType !== "attr" && partType !== "class") {
    throw new TypeError(`${name} must contain exactly one interpolation`);
  }
}

function isSpreadAttribute(rawName: string): boolean {
  return rawName[0] === "." && rawName[1] === "." && rawName[2] === ".";
}

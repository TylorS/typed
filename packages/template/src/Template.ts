import { type Inspectable, NodeInspectSymbol } from "effect/Inspectable";

/**
 * Represents a parsed HTML template.
 *
 * A `Template` instance contains the static structure of an HTML template (nodes)
 * and metadata about dynamic parts (interpolation points).
 *
 * @remarks
 * ## Why
 *
 * The parsed AST is the shared contract for DOM compilation, streamed SSR, and
 * hydration hashes. Renderer authors can inspect every static node and dynamic
 * path instead of relying on hidden compiler machinery.
 *
 * ## Ownership and lifetime
 *
 * A Template owns its arrays and scalar metadata but no DOM nodes, subscriptions,
 * listeners, or Scope. Render layers may cache compiled forms by literal identity.
 *
 * @example
 * ```ts
 * import { parse } from "@typed/template/Parser"
 *
 * // Array boundaries describe interpolation positions; values are rendered later.
 * const template = parse(["<div>Hello ", "</div>"])
 *
 * // Access template structure
 * console.log(template.nodes) // Array of parsed nodes
 * console.log(template.parts) // Array of dynamic parts
 * console.log(template.hash) // Unique hash for caching
 * ```
 *
 * @since 1.0.0
 * @category Template structure
 */
export class Template implements Inspectable {
  /** AST discriminant used by inspectors and renderer tooling.
   * @remarks
   * ## Why
   * Enables exhaustive structural inspection.
   * ## Ownership and lifetime
   * Immutable metadata for this parsed template.
   * @since 1.0.0
   * @category Template structure
   */
  readonly _tag = "template";

  /**
   * The root nodes of the template.
   * @remarks
   * ## Why
   * Defines the exact authored root structure shared by all renderers.
   * ## Ownership and lifetime
   * The Template retains this parsed array, not live DOM.
   * @since 1.0.0
   * @category Template structure
   */
  readonly nodes: ReadonlyArray<Node>;

  /**
   * A unique hash representing the template content. Used for caching and hydration.
   * @remarks
   * ## Why
   * Matches compiled SSR ranges to the same authored literal during hydration.
   * ## Ownership and lifetime
   * Immutable metadata for the Template lifetime.
   * @since 1.0.0
   * @category Template identity
   */
  readonly hash: string;

  /**
   * A list of dynamic parts in the template.
   * Each part is associated with a path (array of indices) to locate the corresponding
   * node in the DOM tree.
   * @remarks
   * ## Why
   * Direct paths let compilers capture precise update targets once.
   * ## Ownership and lifetime
   * The Template retains parsed paths; render Scopes own live part instances.
   * @since 1.0.0
   * @category Dynamic positions
   */
  readonly parts: ReadonlyArray<readonly [part: PartNode | SparsePartNode, path: Array<number>]>;

  /** Creates a parsed Template from explicit AST, hash, and part paths.
   * @remarks
   * ## Why
   * Parser and renderer tooling can construct the complete public model directly.
   * ## Ownership and lifetime
   * The instance retains the supplied arrays and owns no renderer resource.
   * @since 1.0.0
   * @category Template structure
   */
  constructor(
    nodes: ReadonlyArray<Node>,
    hash: string,
    parts: ReadonlyArray<readonly [part: PartNode | SparsePartNode, path: Array<number>]>,
  ) {
    this.nodes = nodes;
    this.hash = hash;
    this.parts = parts;
  }

  /** Returns the stable inspectable representation of this AST.
   * @remarks
   * ## Why
   * Tooling can inspect compiler output without accessing private state.
   * ## Ownership and lifetime
   * Returns references to immutable parsed data; no DOM is created.
   * @since 1.0.0
   * @category Template inspection
   */
  toJSON() {
    return {
      _tag: "template",
      nodes: this.nodes,
      hash: this.hash,
      parts: this.parts,
    };
  }

  /** Supplies Effect's Node inspection protocol.
   * @remarks
   * ## Why
   * Debug output uses the same public JSON structure.
   * ## Ownership and lifetime
   * Delegates to `toJSON` and acquires nothing.
   * @since 1.0.0
   * @category Template inspection
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
}

/**
 * Represents an AST node that can structurally contain template children.
 *
 * @remarks
 * ## Why
 *
 * Renderer compilers can narrow parent-capable syntax without duplicating the
 * full node union.
 *
 * ## Ownership and lifetime
 *
 * This type owns no parsed node or live DOM.
 *
 * @example
 * ```ts
 * import { ElementNode, type ParentNode } from "@typed/template/Template"
 *
 * const parent: ParentNode = new ElementNode("section", [], [])
 * ```
 *
 * @since 1.0.0
 * @category Element structure
 */
export type ParentNode = ElementNode | SelfClosingElementNode | TextOnlyElement;

/**
 * Represents any root or child node in the renderer-neutral template AST.
 *
 * @remarks
 * ## Why
 *
 * DOM and HTML compilers exhaustively dispatch on the public `_tag` union.
 *
 * ## Ownership and lifetime
 *
 * This union describes parsed data and owns no renderer resource.
 *
 * @example
 * ```ts
 * import { TextNode, type Node } from "@typed/template/Template"
 *
 * const node: Node = new TextNode("hello")
 * ```
 *
 * @since 1.0.0
 * @category Template structure
 */
export type Node =
  | ElementNode
  | SelfClosingElementNode
  | TextOnlyElement
  | TextNode
  | NodePart
  | Comment
  | DocType;

/**
 * Represents a single dynamic interpolation part in the template AST.
 *
 * @remarks
 * ## Why
 *
 * Each tag selects precise DOM update and SSR escaping behavior instead of one
 * generic interpolation operation.
 *
 * ## Ownership and lifetime
 *
 * The part records an input index; the render Scope owns the eventual updater.
 *
 * @example
 * ```ts
 * import { TextPartNode, type PartNode } from "@typed/template/Template"
 *
 * const part: PartNode = new TextPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Dynamic positions
 */
export type PartNode =
  | AttrPartNode
  | BooleanPartNode
  | ClassNamePartNode
  | DataPartNode
  | EventPartNode
  | NodePart
  | PropertyPartNode
  | PropertiesPartNode
  | RefPartNode
  | TextPartNode
  | CommentPartNode;

/**
 * Represents a "sparse" part, which is a text or attribute value composed of
 * mix of static text and dynamic parts (e.g. `id="prefix-${id}"`).
 *
 * @remarks
 * ## Why
 *
 * Sparse syntax preserves literal segments while still giving every dynamic
 * value context-specific update and escaping semantics.
 *
 * ## Ownership and lifetime
 *
 * The AST values own no reactive producer; render Scopes own evaluation.
 *
 * @example
 * ```ts
 * import { SparseTextNode, type SparsePartNode } from "@typed/template/Template"
 *
 * const part: SparsePartNode = new SparseTextNode([])
 * ```
 *
 * @since 1.0.0
 * @category Sparse expressions
 */
export type SparsePartNode =
  | SparseAttrNode
  | SparseClassNameNode
  | SparseCommentNode
  | SparseTextNode;

/**
 * Represents an HTML, SVG, MathML, or foreign-content element with children.
 *
 * @remarks
 * ## Why
 *
 * Keeping the authored tag, attributes, and children explicit lets DOM
 * compilation apply native namespace rules and SSR preserve author markup.
 *
 * ## Ownership and lifetime
 *
 * The model owns only parsed arrays and strings, never the eventual Element.
 *
 * @example
 * ```ts
 * import { ElementNode } from "@typed/template/Template"
 *
 * const node = new ElementNode("section", [], [])
 * ```
 *
 * @since 1.0.0
 * @category Element structure
 */
export class ElementNode {
  /**
   * Element-node discriminant.
   * @remarks
   * ## Why
   * Enables exhaustive compilation.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0
   * @category Element structure
   */
  readonly _tag = "element";
  /**
   * Authored qualified tag name.
   * @remarks
   * ## Why
   * Preserves native namespace-sensitive creation.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Element structure
   */
  readonly tagName: string;
  /**
   * Parsed attributes in author order.
   * @remarks
   * ## Why
   * Keeps distinct native directive semantics.
   * ## Ownership and lifetime
   * Retained AST array; no Attr ownership.
   * @since 1.0.0
   * @category Element structure
   */
  readonly attributes: Array<Attribute>;
  /**
   * Parsed child structure.
   * @remarks
   * ## Why
   * Defines the element's compile-time subtree.
   * ## Ownership and lifetime
   * Retained AST array; no DOM ownership.
   * @since 1.0.0
   * @category Element structure
   */
  readonly children: Array<Node>;
  /**
   * Creates an element AST node.
   * @remarks
   * ## Why
   * Renderer tooling can construct native element syntax explicitly.
   * ## Ownership and lifetime
   * Retains supplied data and creates no Element.
   * @since 1.0.0
   * @category Element structure
   */
  constructor(tagName: string, attributes: Array<Attribute>, children: Array<Node>) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.children = children;
  }
}

/**
 * Represents a dynamic insertion point within the node structure (e.g. `<div>${content}</div>`).
 *
 * @remarks
 * ## Why
 *
 * A node part is a bounded structural range, allowing local reconciliation and
 * arbitrary DOM output without a wrapper element.
 *
 * ## Ownership and lifetime
 *
 * The AST stores only the value index; the part's child Scope owns live output.
 *
 * @example
 * ```ts
 * import { NodePart } from "@typed/template/Template"
 *
 * const part = new NodePart(0)
 * ```
 *
 * @since 1.0.0
 * @category Dynamic child positions
 */
export class NodePart {
  /**
   * Node-part discriminant.
   * @remarks
   * ## Why
   * Selects bounded structural rendering.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0
   * @category Dynamic child positions
   */
  readonly _tag = "node";
  /**
   * The index of the value in the interpolation array.
   * @remarks
   * ## Why
   * Selects the producer for this exact dynamic range.
   * ## Ownership and lifetime
   * Immutable index; the mounted range owns its producer Scope.
   * @since 1.0.0
   * @category Dynamic child positions
   */
  readonly index: number;
  /**
   * Creates a structural part for one interpolation index.
   * @remarks
   * ## Why
   * Parser tooling records exact producer paths.
   * ## Ownership and lifetime
   * Stores only the index.
   * @since 1.0.0
   * @category Dynamic child positions
   */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents a self-closing HTML element (e.g. `<br />`, `<img />`).
 *
 * @remarks
 * ## Why
 *
 * The distinct tag preserves author syntax for compilation and serialization.
 *
 * ## Ownership and lifetime
 *
 * The model owns parsed metadata, not the eventual native Element.
 *
 * @example
 * ```ts
 * import { SelfClosingElementNode } from "@typed/template/Template"
 *
 * const node = new SelfClosingElementNode("img", [])
 * ```
 *
 * @since 1.0.0
 * @category Element structure
 */
export class SelfClosingElementNode {
  /**
   * Self-closing-element discriminant.
   * @remarks
   * ## Why
   * Preserves author syntax in compilation.
   * ## Ownership and lifetime
   * Immutable metadata.
   * @since 1.0.0
   * @category Element structure
   */
  readonly _tag = "self-closing-element";
  /**
   * Authored tag name.
   * @remarks
   * ## Why
   * Selects the native element kind.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Element structure
   */
  readonly tagName: string;
  /**
   * Parsed attributes.
   * @remarks
   * ## Why
   * Retains native directive distinctions.
   * ## Ownership and lifetime
   * Retained AST array.
   * @since 1.0.0
   * @category Element structure
   */
  readonly attributes: Array<Attribute>;
  /**
   * Creates a self-closing element AST node.
   * @remarks
   * ## Why
   * Makes compiler input explicit.
   * ## Ownership and lifetime
   * Retains parsed data and creates no DOM.
   * @since 1.0.0
   * @category Element structure
   */
  constructor(tagName: string, attributes: Array<Attribute>) {
    this.tagName = tagName;
    this.attributes = attributes;
  }
}

/**
 * Represents an element that contains only text (e.g. `<script>`, `<style>`).
 *
 * @remarks
 * ## Why
 *
 * Script, style, textarea, title, and related contexts require dedicated parsing
 * and context-aware closing-tag neutralization during SSR.
 *
 * ## Ownership and lifetime
 *
 * This is parsed data; it owns no live element or executable script.
 *
 * @example
 * ```ts
 * import { TextOnlyElement } from "@typed/template/Template"
 *
 * const node = new TextOnlyElement("style", [], null)
 * ```
 *
 * @since 1.0.0
 * @category Text contexts
 */
export class TextOnlyElement {
  /**
   * Text-only-element discriminant.
   * @remarks
   * ## Why
   * Selects special parsing and escaping.
   * ## Ownership and lifetime
   * Immutable metadata.
   * @since 1.0.0
   * @category Text contexts
   */
  readonly _tag = "text-only-element";

  /**
   * Authored tag name.
   * @remarks
   * ## Why
   * Determines script/style/textarea/title serialization rules.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Text contexts
   */
  readonly tagName: string;
  /**
   * Parsed attributes.
   * @remarks
   * ## Why
   * Preserves native attribute semantics.
   * ## Ownership and lifetime
   * Retained AST array.
   * @since 1.0.0
   * @category Text contexts
   */
  readonly attributes: Array<Attribute>;
  /**
   * Parsed text content or absence.
   * @remarks
   * ## Why
   * Keeps text-only context distinct from child nodes.
   * ## Ownership and lifetime
   * Retained AST value.
   * @since 1.0.0
   * @category Text contexts
   */
  readonly textContent: Text | null;
  /**
   * Creates a text-only element AST node.
   * @remarks
   * ## Why
   * Renderer tooling can model special text contexts.
   * ## Ownership and lifetime
   * Retains parsed data and creates no DOM.
   * @since 1.0.0
   * @category Text contexts
   */
  constructor(tagName: string, attributes: Array<Attribute>, textContent: Text | null) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.textContent = textContent;
  }
}

/**
 * Represents a parsed DOCTYPE declaration.
 *
 * @remarks
 * ## Why
 *
 * Renderer-neutral parsing retains document declaration metadata explicitly.
 *
 * ## Ownership and lifetime
 *
 * The value owns strings only and has no document lifetime.
 *
 * @example
 * ```ts
 * import { DocType } from "@typed/template/Template"
 *
 * const node = new DocType("html")
 * ```
 *
 * @since 1.0.0
 * @category Document structure
 */
export class DocType {
  /**
   * Doctype discriminant.
   * @remarks
   * ## Why
   * Selects declaration serialization.
   * ## Ownership and lifetime
   * Immutable metadata.
   * @since 1.0.0
   * @category Document structure
   */
  readonly _tag = "doctype";
  /**
   * Declared document type name.
   * @remarks
   * ## Why
   * Preserves author declaration data.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Document structure
   */
  readonly name: string;
  /**
   * Optional public identifier.
   * @remarks
   * ## Why
   * Preserves complete doctype metadata.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Document structure
   */
  readonly publicId: string | undefined;
  /**
   * Optional system identifier.
   * @remarks
   * ## Why
   * Preserves complete doctype metadata.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0
   * @category Document structure
   */
  readonly systemId: string | undefined;
  /**
   * Creates a doctype AST node.
   * @remarks
   * ## Why
   * Makes declaration tooling explicit.
   * ## Ownership and lifetime
   * Stores strings only.
   * @since 1.0.0
   * @category Document structure
   */
  constructor(name: string, publicType?: string, systemId?: string) {
    this.name = name;
    this.publicId = publicType;
    this.systemId = systemId;
  }
}

/**
 * Represents every static or dynamic attribute-like AST node.
 *
 * @remarks
 * ## Why
 *
 * Attribute, property, event, ref, class, data, boolean, and spread semantics
 * remain distinct for native DOM updates and safe SSR serialization.
 *
 * ## Ownership and lifetime
 *
 * The union owns no Attr, listener, ref target, or Scope.
 *
 * @example
 * ```ts
 * import { AttributeNode, type Attribute } from "@typed/template/Template"
 *
 * const attribute: Attribute = new AttributeNode("aria-label", "Close")
 * ```
 *
 * @since 1.0.0
 * @category Attribute syntax
 */
export type Attribute =
  | AttributeNode
  | AttrPartNode
  | SparseAttrNode
  | BooleanNode
  | BooleanPartNode
  | ClassNamePartNode
  | SparseClassNameNode
  | DataPartNode
  | EventPartNode
  | PropertyPartNode
  | PropertiesPartNode
  | RefPartNode;

/**
 * Represents a static attribute (e.g. `class="foo"`).
 *
 * @remarks
 * ## Why
 *
 * Static authored names and values can be compiled once without a dynamic updater.
 *
 * ## Ownership and lifetime
 *
 * The model owns strings only; the renderer creates the native Attr.
 *
 * @example
 * ```ts
 * import { AttributeNode } from "@typed/template/Template"
 *
 * const node = new AttributeNode("class", "notice")
 * ```
 *
 * @since 1.0.0
 * @category Attribute syntax
 */
export class AttributeNode {
  /** Static-attribute discriminant.
   * @remarks
   * ## Why
   * Selects one-time native attribute creation and SSR serialization.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Attribute syntax */
  readonly _tag = "attribute" as const;
  /** Native attribute name.
   * @remarks
   * ## Why
   * Preserves the authored attribute target.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Attribute syntax */
  readonly name: string;
  /** Authored static value.
   * @remarks
   * ## Why
   * Compiles without a dynamic producer.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Attribute syntax */
  readonly value: string;
  /** Creates static attribute syntax. @since 1.0.0 @category Attribute syntax */
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
}

/**
 * Represents a dynamic attribute (e.g. `src="${url}"`).
 *
 * @remarks
 * ## Why
 *
 * The retained input index drives direct local attribute updates and escaped SSR.
 *
 * ## Ownership and lifetime
 *
 * The part owns no Attr or producer; the render Scope owns both updater and source.
 *
 * @example
 * ```ts
 * import { AttrPartNode } from "@typed/template/Template"
 *
 * const part = new AttrPartNode("src", 0)
 * ```
 *
 * @since 1.0.0
 * @category Attribute bindings
 */
export class AttrPartNode {
  /** Dynamic-attribute discriminant.
   * @remarks
   * ## Why
   * Selects direct Attr updates and escaped SSR.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Attribute bindings */
  readonly _tag = "attr" as const;
  /** Native attribute name.
   * @remarks
   * ## Why
   * Identifies the target whose sparse segments are joined.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Attribute bindings */
  readonly name: string;
  /** Interpolation index driving this attribute.
   * @remarks
   * ## Why
   * Locates the producer for one retained Attr target.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Attribute bindings */
  readonly index: number;
  /** Creates dynamic attribute syntax. @since 1.0.0 @category Attribute bindings */
  constructor(name: string, index: number) {
    this.name = name;
    this.index = index;
  }
}

/**
 * Represents a sparse attribute (e.g. `class="foo ${bar}"`).
 *
 * @remarks
 * ## Why
 *
 * Static and dynamic segments remain ordered under one native attribute target.
 *
 * ## Ownership and lifetime
 *
 * The model owns its segment array; the renderer Scope owns the live updater.
 *
 * @example
 * ```ts
 * import { SparseAttrNode } from "@typed/template/Template"
 *
 * const node = new SparseAttrNode("title", [])
 * ```
 *
 * @since 1.0.0
 * @category Sparse attributes
 */
export class SparseAttrNode {
  /** Sparse-attribute discriminant.
   * @remarks
   * ## Why
   * Selects ordered segment joining under attribute escaping.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Sparse attributes */
  readonly _tag = "sparse-attr" as const;
  /** Native attribute name.
   * @remarks
   * ## Why
   * Identifies the direct attribute target for one interpolation.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Sparse attributes */
  readonly name: string;
  /** Ordered literal and dynamic segments.
   * @remarks
   * ## Why
   * Reconstructs one attribute value from its authored order.
   * ## Ownership and lifetime
   * Retained AST array; mounted parts own live inputs.
   * @since 1.0.0 @category Sparse attributes */
  readonly nodes: Array<AttrPartNode | TextNode>;
  /** Creates sparse attribute syntax. @since 1.0.0 @category Sparse attributes */
  constructor(name: string, nodes: Array<AttrPartNode | TextNode>) {
    this.name = name;
    this.nodes = nodes;
  }
}

/**
 * Represents a boolean attribute (e.g. `disabled`).
 *
 * @remarks
 * ## Why
 *
 * Presence-only native HTML semantics are distinct from string attributes.
 *
 * ## Ownership and lifetime
 *
 * The model owns only the parsed name.
 *
 * @example
 * ```ts
 * import { BooleanNode } from "@typed/template/Template"
 *
 * const node = new BooleanNode("disabled")
 * ```
 *
 * @since 1.0.0
 * @category Boolean attributes
 */
export class BooleanNode {
  /** Static-boolean discriminant.
   * @remarks
   * ## Why
   * Selects presence-only native attribute semantics.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Boolean attributes */
  readonly _tag = "boolean" as const;
  /** Presence-only native attribute name.
   * @remarks
   * ## Why
   * Identifies the exact boolean attribute to create.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Boolean attributes */
  readonly name: string;
  /** Creates static boolean-attribute syntax. @since 1.0.0 @category Boolean attributes */
  constructor(name: string) {
    this.name = name;
  }
}

/**
 * Represents a dynamic boolean attribute (e.g. `?disabled="${isDisabled}"`).
 *
 * @remarks
 * ## Why
 *
 * Truth values add or remove the native attribute rather than stringify it.
 *
 * ## Ownership and lifetime
 *
 * The part owns no Attr; its render Scope owns the retained updater.
 *
 * @example
 * ```ts
 * import { BooleanPartNode } from "@typed/template/Template"
 *
 * const part = new BooleanPartNode("disabled", 0)
 * ```
 *
 * @since 1.0.0
 * @category Boolean attributes
 */
export class BooleanPartNode {
  /** Dynamic-boolean discriminant.
   * @remarks
   * ## Why
   * Selects native attribute presence toggling.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Boolean attributes */
  readonly _tag = "boolean-part" as const;
  /** Native boolean attribute name.
   * @remarks
   * ## Why
   * Identifies the exact attribute updated by the part.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Boolean attributes */
  readonly name: string;
  /** Interpolation index controlling presence.
   * @remarks
   * ## Why
   * Locates the boolean producer without tree traversal.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Boolean attributes */
  readonly index: number;
  /** Creates dynamic boolean-attribute syntax. @since 1.0.0 @category Boolean attributes */
  constructor(name: string, index: number) {
    this.name = name;
    this.index = index;
  }
}
/**
 * Represents a dynamic class name part (e.g. `class="${classes}"`).
 *
 * @remarks
 * ## Why
 *
 * Class collections have dedicated normalization while preserving unrelated
 * classes owned by external code.
 *
 * ## Ownership and lifetime
 *
 * The part owns only an index; the mounted part owns its local class contribution.
 *
 * @example
 * ```ts
 * import { ClassNamePartNode } from "@typed/template/Template"
 *
 * const part = new ClassNamePartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Class contributions
 */
export class ClassNamePartNode {
  /** Dynamic-class discriminant.
   * @remarks
   * ## Why
   * Selects class normalization without replacing external classes.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Class contributions */
  readonly _tag = "className-part" as const;
  /** Interpolation index producing class values.
   * @remarks
   * ## Why
   * Locates the producer for one retained class contribution.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Class contributions */
  readonly index: number;
  /** Creates dynamic class syntax. @since 1.0.0 @category Class contributions */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents a sparse class name (e.g. `class="foo ${bar}"`).
 *
 * @remarks
 * ## Why
 *
 * Literal and reactive classes remain one locally managed class expression.
 *
 * ## Ownership and lifetime
 *
 * The model owns segments; the mounted part owns only classes it contributes.
 *
 * @example
 * ```ts
 * import { SparseClassNameNode } from "@typed/template/Template"
 *
 * const node = new SparseClassNameNode([])
 * ```
 *
 * @since 1.0.0
 * @category Class contributions
 */
export class SparseClassNameNode {
  /** Sparse-class discriminant.
   * @remarks
   * ## Why
   * Selects ordered literal/reactive class joining.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Class contributions */
  readonly _tag = "sparse-class-name" as const;

  /** Ordered literal and dynamic class segments.
   * @remarks
   * ## Why
   * Defines only this part's class contribution.
   * ## Ownership and lifetime
   * Retained AST array; mounted parts own live inputs.
   * @since 1.0.0 @category Class contributions */
  readonly nodes: Array<ClassNamePartNode | TextNode>;
  /** Creates sparse class syntax. @since 1.0.0 @category Class contributions */
  constructor(nodes: Array<ClassNamePartNode | TextNode>) {
    this.nodes = nodes;
  }
}

/**
 * Represents a data attribute part (e.g. `data-foo="${value}"`).
 *
 * @remarks
 * ## Why
 *
 * Data records map to the native `dataset`/`data-*` surface without replacing
 * unrelated attributes.
 *
 * ## Ownership and lifetime
 *
 * The part stores one input index; its render Scope owns local updates.
 *
 * @example
 * ```ts
 * import { DataPartNode } from "@typed/template/Template"
 *
 * const part = new DataPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Dataset contributions
 */
export class DataPartNode {
  /** Data-record discriminant.
   * @remarks
   * ## Why
   * Selects native dataset and safe `data-*` serialization.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Dataset contributions */
  readonly _tag = "data" as const;

  /** Interpolation index producing the data record.
   * @remarks
   * ## Why
   * Locates the record producer for local dataset updates.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Dataset contributions */
  readonly index: number;
  /** Creates data-record syntax. @since 1.0.0 @category Dataset contributions */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents an event listener part (e.g. `@click="${handler}"`).
 *
 * @remarks
 * ## Why
 *
 * The event name maps to a real delegated DOM listener and never to a synthetic
 * event protocol.
 *
 * ## Ownership and lifetime
 *
 * The model owns no listener. The mounted render Scope installs and removes it.
 *
 * @example
 * ```ts
 * import { EventPartNode } from "@typed/template/Template"
 *
 * const part = new EventPartNode("click", 0)
 * ```
 *
 * @since 1.0.0
 * @category Native event bindings
 */
export class EventPartNode {
  /** Native-event discriminant.
   * @remarks
   * ## Why
   * Selects real DOM listener setup and omits events from SSR attributes.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Native event bindings */
  readonly _tag = "event" as const;
  /** Native event name.
   * @remarks
   * ## Why
   * Identifies the browser event name delegated by EventSource; callbacks
   * receive its forwarding `currentTarget` Proxy rather than the original
   * event object identity.
   * ## Ownership and lifetime
   * Retained string metadata; the mount Scope owns the listener.
   * @since 1.0.0 @category Native event bindings */
  readonly name: string;
  /** Interpolation index producing the Effect handler.
   * @remarks
   * ## Why
   * Locates the handler while preserving its error and service channels.
   * ## Ownership and lifetime
   * Immutable scalar metadata; EventSource owns running fibers through its Scope.
   * @since 1.0.0 @category Native event bindings */
  readonly index: number;
  /** Creates native event-listener syntax. @since 1.0.0 @category Native event bindings */
  constructor(name: string, index: number) {
    this.name = name;
    this.index = index;
  }
}

/**
 * Represents a property assignment (e.g. `.value="${value}"`).
 *
 * @remarks
 * ## Why
 *
 * Native element properties remain distinct from serialized attributes.
 *
 * ## Ownership and lifetime
 *
 * The part stores metadata; the mounted part owns its local property writes.
 *
 * @example
 * ```ts
 * import { PropertyPartNode } from "@typed/template/Template"
 *
 * const part = new PropertyPartNode("value", 0)
 * ```
 *
 * @since 1.0.0
 * @category Property bindings
 */
export class PropertyPartNode {
  /** Native-property discriminant.
   * @remarks
   * ## Why
   * Selects property assignment rather than attribute serialization.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Property bindings */
  readonly _tag = "property" as const;
  /** Native property name.
   * @remarks
   * ## Why
   * Identifies the exact property target on the native element.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Property bindings */
  readonly name: string;
  /** Interpolation index producing the property value.
   * @remarks
   * ## Why
   * Locates the producer for one direct property update.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Property bindings */
  readonly index: number;
  /** Creates native property syntax. @since 1.0.0 @category Property bindings */
  constructor(name: string, index: number) {
    this.name = name;
    this.index = index;
  }
}

/**
 * Represents a spread of properties (e.g. `${...props}`).
 *
 * @remarks
 * ## Why
 *
 * A spread may combine attribute, boolean, class, data, property, event, and ref
 * directives while each retains its own native semantics.
 *
 * ## Ownership and lifetime
 *
 * The mounted spread tracks and disposes only keys it owns. SSR excludes
 * event/property/ref and unsafe keys.
 *
 * @example
 * ```ts
 * import { PropertiesPartNode } from "@typed/template/Template"
 *
 * const part = new PropertiesPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Spread bindings
 */
export class PropertiesPartNode {
  /** Property-spread discriminant.
   * @remarks
   * ## Why
   * Selects recursive directive setup and safe SSR filtering.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Spread bindings */
  readonly _tag = "properties" as const;
  /** Interpolation index producing the directive record.
   * @remarks
   * ## Why
   * Locates the record whose keys become local directive instances.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the spread instance owns per-key cleanup.
   * @since 1.0.0 @category Spread bindings */
  readonly index: number;
  /** Creates property-spread syntax. @since 1.0.0 @category Spread bindings */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents a reference capture (e.g. `ref="${ref}"`).
 *
 * @remarks
 * ## Why
 *
 * Refs expose the exact native node and hydration metadata without a component
 * instance abstraction.
 *
 * ## Ownership and lifetime
 *
 * The model owns no reference. The render Scope runs ref setup and finalization.
 *
 * @example
 * ```ts
 * import { RefPartNode } from "@typed/template/Template"
 *
 * const part = new RefPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Element references
 */
export class RefPartNode {
  /** Native-ref discriminant.
   * @remarks
   * ## Why
   * Selects exact-node ref setup and hydration metadata.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Element references */
  readonly _tag = "ref" as const;

  /** Interpolation index producing the ref handler.
   * @remarks
   * ## Why
   * Locates the handler for the exact native node.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns setup and finalization.
   * @since 1.0.0 @category Element references */
  readonly index: number;
  /** Creates native node-ref syntax. @since 1.0.0 @category Element references */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents static, dynamic, or sparse text content.
 *
 * @remarks
 * ## Why
 *
 * Text-only element contexts need a dedicated union for correct escaping and
 * closing-tag neutralization.
 *
 * ## Ownership and lifetime
 *
 * The alias describes AST data and owns no native Text node.
 *
 * @example
 * ```ts
 * import { TextNode, type Text } from "@typed/template/Template"
 *
 * const text: Text = new TextNode("hello")
 * ```
 *
 * @since 1.0.0
 * @category Text content
 */
export type Text = TextNode | TextPartNode | SparseTextNode;

/**
 * Represents a static text node.
 *
 * @remarks
 * ## Why
 *
 * Static author text can be compiled once into native text or SSR output.
 *
 * ## Ownership and lifetime
 *
 * The model owns one string and no DOM node.
 *
 * @example
 * ```ts
 * import { TextNode } from "@typed/template/Template"
 *
 * const node = new TextNode("hello")
 * ```
 *
 * @since 1.0.0
 * @category Text content
 */
export class TextNode {
  /** Static-text discriminant.
   * @remarks
   * ## Why
   * Selects one-time native text creation and escaped SSR output.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Text content */
  readonly _tag = "text" as const;

  /** Authored text value.
   * @remarks
   * ## Why
   * Preserves exact literal content for compilation.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Text content */
  readonly value: string;
  /** Creates static text syntax. @since 1.0.0 @category Text content */
  constructor(value: string) {
    this.value = value;
  }
}

/**
 * Represents a dynamic text part (e.g. `${text}`).
 *
 * @remarks
 * ## Why
 *
 * A retained native text target supports O(1) scalar updates with respect to
 * the surrounding DOM tree.
 *
 * ## Ownership and lifetime
 *
 * The AST owns only an index; the mounted render Scope owns the text updater.
 *
 * @example
 * ```ts
 * import { TextPartNode } from "@typed/template/Template"
 *
 * const part = new TextPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Text bindings
 */
export class TextPartNode {
  /** Dynamic-text discriminant.
   * @remarks
   * ## Why
   * Selects a retained native Text target for O(1) scalar updates.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Text bindings */
  readonly _tag = "text-part" as const;

  /** Interpolation index driving the retained text target.
   * @remarks
   * ## Why
   * Locates the producer without walking the surrounding tree.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Text bindings */
  readonly index: number;
  /** Creates dynamic text syntax. @since 1.0.0 @category Text bindings */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents sparse text content (e.g. `Hello ${name}!`).
 *
 * @remarks
 * ## Why
 *
 * Literal and dynamic segments update one local text target without structural
 * reconciliation.
 *
 * ## Ownership and lifetime
 *
 * The model owns segments; the mounted Scope owns the native text updater.
 *
 * @example
 * ```ts
 * import { SparseTextNode } from "@typed/template/Template"
 *
 * const node = new SparseTextNode([])
 * ```
 *
 * @since 1.0.0
 * @category Sparse text
 */
export class SparseTextNode {
  /** Sparse-text discriminant.
   * @remarks
   * ## Why
   * Selects ordered segment joining into one retained text target.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Sparse text */
  readonly _tag = "sparse-text" as const;
  /** Ordered literal and dynamic text segments.
   * @remarks
   * ## Why
   * Reconstructs one text value in author order.
   * ## Ownership and lifetime
   * Retained AST array; the mounted part owns live inputs.
   * @since 1.0.0 @category Sparse text */
  readonly nodes: Array<TextNode | TextPartNode>;
  /** Creates sparse text syntax. @since 1.0.0 @category Sparse text */
  constructor(nodes: Array<TextNode | TextPartNode>) {
    this.nodes = nodes;
  }
}

/**
 * Represents static, dynamic, or sparse comment content.
 *
 * @remarks
 * ## Why
 *
 * Native comments serve both authored output and transparent renderer markers.
 *
 * ## Ownership and lifetime
 *
 * The alias owns no native Comment node.
 *
 * @example
 * ```ts
 * import { CommentNode, type Comment } from "@typed/template/Template"
 *
 * const comment: Comment = new CommentNode("boundary")
 * ```
 *
 * @since 1.0.0
 * @category Comment content
 */
export type Comment = CommentNode | CommentPartNode | SparseCommentNode;

/**
 * Represents a static comment.
 *
 * @remarks
 * ## Why
 *
 * Author comments remain explicit AST nodes across DOM and HTML output.
 *
 * ## Ownership and lifetime
 *
 * The model owns a string and no native node.
 *
 * @example
 * ```ts
 * import { CommentNode } from "@typed/template/Template"
 *
 * const node = new CommentNode("note")
 * ```
 *
 * @since 1.0.0
 * @category Comment content
 */
export class CommentNode {
  /** Static-comment discriminant.
   * @remarks
   * ## Why
   * Selects one-time native comment creation and SSR serialization.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Comment content */
  readonly _tag = "comment" as const;

  /** Authored comment value.
   * @remarks
   * ## Why
   * Preserves exact literal comment content.
   * ## Ownership and lifetime
   * Retained string metadata.
   * @since 1.0.0 @category Comment content */
  readonly value: string;
  /** Creates static comment syntax. @since 1.0.0 @category Comment content */
  constructor(value: string) {
    this.value = value;
  }
}

/**
 * Represents a dynamic comment part.
 *
 * @remarks
 * ## Why
 *
 * Dynamic comment output has an explicit escaped representation and direct
 * native Comment target.
 *
 * ## Ownership and lifetime
 *
 * The AST owns only an index; the render Scope owns the updater.
 *
 * @example
 * ```ts
 * import { CommentPartNode } from "@typed/template/Template"
 *
 * const part = new CommentPartNode(0)
 * ```
 *
 * @since 1.0.0
 * @category Comment bindings
 */
export class CommentPartNode {
  /** Dynamic-comment discriminant.
   * @remarks
   * ## Why
   * Selects a retained native Comment target for direct updates.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Comment bindings */
  readonly _tag = "comment-part" as const;

  /** Interpolation index driving the retained comment target.
   * @remarks
   * ## Why
   * Locates the producer without structural reconciliation.
   * ## Ownership and lifetime
   * Immutable scalar metadata; the render Scope owns the producer.
   * @since 1.0.0 @category Comment bindings */
  readonly index: number;
  /** Creates dynamic comment syntax. @since 1.0.0 @category Comment bindings */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents a sparse comment.
 *
 * @remarks
 * ## Why
 *
 * Literal and dynamic comment segments remain one local native comment value.
 *
 * ## Ownership and lifetime
 *
 * The model owns segments; the mounted Scope owns the comment updater.
 *
 * @example
 * ```ts
 * import { SparseCommentNode } from "@typed/template/Template"
 *
 * const node = new SparseCommentNode([])
 * ```
 *
 * @since 1.0.0
 * @category Sparse comments
 */
export class SparseCommentNode {
  /** Sparse-comment discriminant.
   * @remarks
   * ## Why
   * Selects ordered segment joining into one native Comment.
   * ## Ownership and lifetime
   * Immutable AST metadata.
   * @since 1.0.0 @category Sparse comments */
  readonly _tag = "sparse-comment" as const;

  /** Ordered literal and dynamic comment segments.
   * @remarks
   * ## Why
   * Reconstructs one comment value in author order.
   * ## Ownership and lifetime
   * Retained AST array; the mounted part owns live inputs.
   * @since 1.0.0 @category Sparse comments */
  readonly nodes: Array<TextNode | CommentPartNode>;
  /** Creates sparse comment syntax. @since 1.0.0 @category Sparse comments */
  constructor(nodes: Array<TextNode | CommentPartNode>) {
    this.nodes = nodes;
  }
}

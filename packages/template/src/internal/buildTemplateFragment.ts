import type * as Template from "../Template.js";

export const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const MATHML_TEXT_INTEGRATION = "mathml-text-integration";

export type NamespaceContext =
  | typeof HTML_NAMESPACE
  | typeof MATHML_NAMESPACE
  | typeof SVG_NAMESPACE
  | typeof MATHML_TEXT_INTEGRATION;

type AttributeDescriptor = {
  readonly namespace: string | null;
  readonly qualifiedName: string;
  readonly localName: string;
};

export function getInsertionNamespace(parent: Element | undefined): NamespaceContext {
  if (parent === undefined) return HTML_NAMESPACE;
  return getChildNamespace(
    parent.namespaceURI,
    parent.localName,
    isHtmlEncoding(parent.getAttribute("encoding")),
  );
}

export function getAttributeDescriptor(
  elementNamespace: string | null,
  name: string,
): AttributeDescriptor {
  const lowerName = name.toLowerCase();
  if (elementNamespace === HTML_NAMESPACE) {
    return { namespace: null, qualifiedName: lowerName, localName: lowerName };
  }
  if (lowerName === "xmlns" || lowerName.startsWith("xmlns:")) {
    return {
      namespace: XMLNS_NAMESPACE,
      qualifiedName: lowerName,
      localName: lowerName === "xmlns" ? "xmlns" : lowerName.slice("xmlns:".length),
    };
  }
  if (lowerName.startsWith("xlink:")) {
    return {
      namespace: XLINK_NAMESPACE,
      qualifiedName: lowerName,
      localName: lowerName.slice("xlink:".length),
    };
  }
  if (lowerName.startsWith("xml:")) {
    return {
      namespace: XML_NAMESPACE,
      qualifiedName: lowerName,
      localName: lowerName.slice("xml:".length),
    };
  }

  const qualifiedName =
    elementNamespace === MATHML_NAMESPACE && lowerName === "definitionurl"
      ? "definitionURL"
      : elementNamespace === SVG_NAMESPACE
        ? (SVG_ATTRIBUTE_NAMES[lowerName] ?? name)
        : name;
  return { namespace: null, qualifiedName, localName: qualifiedName };
}

function getElementNamespace(context: NamespaceContext, tagName: string): string {
  const name = tagName.toLowerCase();
  if (context === MATHML_TEXT_INTEGRATION) {
    return name === "mglyph" || name === "malignmark"
      ? MATHML_NAMESPACE
      : getHtmlElementNamespace(name);
  }
  return context === HTML_NAMESPACE ? getHtmlElementNamespace(name) : context;
}

function getChildNamespace(
  elementNamespace: string | null,
  localName: string,
  htmlEncoding = false,
): NamespaceContext {
  const name = localName.toLowerCase();
  if (elementNamespace === SVG_NAMESPACE) {
    return name === "foreignobject" || name === "desc" || name === "title"
      ? HTML_NAMESPACE
      : SVG_NAMESPACE;
  }
  if (elementNamespace === MATHML_NAMESPACE) {
    if (name === "mi" || name === "mo" || name === "mn" || name === "ms" || name === "mtext") {
      return MATHML_TEXT_INTEGRATION;
    }
    if (name === "annotation-xml" && htmlEncoding) return HTML_NAMESPACE;
    return MATHML_NAMESPACE;
  }
  return HTML_NAMESPACE;
}

function getTemplateChildNamespace(
  elementNamespace: string,
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
): NamespaceContext {
  return getChildNamespace(elementNamespace, node.tagName, hasHtmlEncoding(node.attributes));
}

function getHtmlElementNamespace(tagName: string): string {
  if (tagName === "svg") return SVG_NAMESPACE;
  if (tagName === "math") return MATHML_NAMESPACE;
  return HTML_NAMESPACE;
}

function getElementQualifiedName(namespace: string, tagName: string): string {
  return namespace === SVG_NAMESPACE ? (SVG_TAG_NAMES[tagName.toLowerCase()] ?? tagName) : tagName;
}

function hasHtmlEncoding(attributes: ReadonlyArray<Template.Attribute>): boolean {
  for (const attribute of attributes) {
    if (
      attribute._tag === "attribute" &&
      attribute.name.toLowerCase() === "encoding" &&
      isHtmlEncoding(attribute.value)
    ) {
      return true;
    }
  }
  return false;
}

function isHtmlEncoding(value: string | null): boolean {
  if (value === null) return false;
  const encoding = value.toLowerCase();
  return encoding === "text/html" || encoding === "application/xhtml+xml";
}

export function buildTemplateFragment(
  document: Document,
  template: Template.Template,
  namespace: NamespaceContext = HTML_NAMESPACE,
): DocumentFragment {
  const root = document.createDocumentFragment();
  for (const node of template.nodes) {
    root.appendChild(buildTemplateNode(document, node, namespace));
  }
  return root;
}

function buildTemplateNode(
  document: Document,
  node: Template.Node,
  namespace: NamespaceContext,
): Node {
  switch (node._tag) {
    case "comment":
      return document.createComment(node.value);
    case "comment-part":
      return document.createComment(`c_${node.index}`);
    case "sparse-comment":
      return document.createComment(
        `c_${node.nodes.map((node) => (node._tag === "text" ? "" : node.index)).join("_")}`,
      );
    case "doctype":
      return document.implementation.createDocumentType(
        node.name,
        node.publicId ?? "",
        node.systemId ?? "",
      );
    case "element":
      return buildTemplateElement(document, node, namespace);
    case "self-closing-element":
      return buildTemplateSelfClosingElement(document, node, namespace);
    case "text-only-element":
      return buildTemplateTextOnlyElement(document, node, namespace);
    case "text":
      return document.createTextNode(node.value);
    case "node":
      return document.createComment(`/n_${node.index}`);
  }
}

function buildTemplateElement(
  document: Document,
  node: Template.ElementNode,
  namespace: NamespaceContext,
): Element {
  const elementNamespace = getElementNamespace(namespace, node.tagName);
  const element = createElement(document, node.tagName, elementNamespace);
  addStaticAttributes(element, node.attributes);
  const childNamespace = getTemplateChildNamespace(elementNamespace, node);
  for (const child of node.children) {
    element.appendChild(buildTemplateNode(document, child, childNamespace));
  }
  return element;
}

function buildTemplateSelfClosingElement(
  document: Document,
  node: Template.SelfClosingElementNode,
  namespace: NamespaceContext,
): Element {
  const elementNamespace = getElementNamespace(namespace, node.tagName);
  const element = createElement(document, node.tagName, elementNamespace);
  addStaticAttributes(element, node.attributes);
  return element;
}

function buildTemplateTextOnlyElement(
  document: Document,
  node: Template.TextOnlyElement,
  namespace: NamespaceContext,
): Element {
  const elementNamespace = getElementNamespace(namespace, node.tagName);
  const element = createElement(document, node.tagName, elementNamespace);
  addStaticAttributes(element, node.attributes);
  if (node.textContent?._tag === "text") element.textContent = node.textContent.value;
  return element;
}

function createElement(document: Document, tagName: string, namespace: string): Element {
  const qualifiedName = getElementQualifiedName(namespace, tagName);
  return namespace === HTML_NAMESPACE
    ? document.createElement(qualifiedName)
    : document.createElementNS(namespace, qualifiedName);
}

function addStaticAttributes(
  element: Element,
  attributes: ReadonlyArray<Template.Attribute>,
): void {
  for (const attribute of attributes) {
    if (attribute._tag !== "attribute" && attribute._tag !== "boolean") continue;
    const descriptor = getAttributeDescriptor(element.namespaceURI, attribute.name);
    const value = attribute._tag === "attribute" ? attribute.value : "";
    if (element.namespaceURI === HTML_NAMESPACE) {
      element.setAttribute(descriptor.qualifiedName, value);
    } else {
      element.setAttributeNS(descriptor.namespace, descriptor.qualifiedName, value);
    }
  }
}

const SVG_TAG_NAMES: Readonly<Record<string, string>> = {
  altglyph: "altGlyph",
  altglyphdef: "altGlyphDef",
  altglyphitem: "altGlyphItem",
  animatecolor: "animateColor",
  animatemotion: "animateMotion",
  animatetransform: "animateTransform",
  clippath: "clipPath",
  feblend: "feBlend",
  fecolormatrix: "feColorMatrix",
  fecomponenttransfer: "feComponentTransfer",
  fecomposite: "feComposite",
  feconvolvematrix: "feConvolveMatrix",
  fediffuselighting: "feDiffuseLighting",
  fedisplacementmap: "feDisplacementMap",
  fedistantlight: "feDistantLight",
  fedropshadow: "feDropShadow",
  feflood: "feFlood",
  fefunca: "feFuncA",
  fefuncb: "feFuncB",
  fefuncg: "feFuncG",
  fefuncr: "feFuncR",
  fegaussianblur: "feGaussianBlur",
  feimage: "feImage",
  femerge: "feMerge",
  femergenode: "feMergeNode",
  femorphology: "feMorphology",
  feoffset: "feOffset",
  fepointlight: "fePointLight",
  fespecularlighting: "feSpecularLighting",
  fespotlight: "feSpotLight",
  fetile: "feTile",
  feturbulence: "feTurbulence",
  foreignobject: "foreignObject",
  glyphref: "glyphRef",
  lineargradient: "linearGradient",
  radialgradient: "radialGradient",
  textpath: "textPath",
};

const SVG_ATTRIBUTE_NAMES: Readonly<Record<string, string>> = {
  attributename: "attributeName",
  attributetype: "attributeType",
  basefrequency: "baseFrequency",
  baseprofile: "baseProfile",
  calcmode: "calcMode",
  clippathunits: "clipPathUnits",
  diffuseconstant: "diffuseConstant",
  edgemode: "edgeMode",
  filterunits: "filterUnits",
  glyphref: "glyphRef",
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
  limitingconeangle: "limitingConeAngle",
  markerheight: "markerHeight",
  markerunits: "markerUnits",
  markerwidth: "markerWidth",
  maskcontentunits: "maskContentUnits",
  maskunits: "maskUnits",
  numoctaves: "numOctaves",
  pathlength: "pathLength",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
  patternunits: "patternUnits",
  pointsatx: "pointsAtX",
  pointsaty: "pointsAtY",
  pointsatz: "pointsAtZ",
  preservealpha: "preserveAlpha",
  preserveaspectratio: "preserveAspectRatio",
  primitiveunits: "primitiveUnits",
  refx: "refX",
  refy: "refY",
  repeatcount: "repeatCount",
  repeatdur: "repeatDur",
  requiredextensions: "requiredExtensions",
  requiredfeatures: "requiredFeatures",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  spreadmethod: "spreadMethod",
  startoffset: "startOffset",
  stddeviation: "stdDeviation",
  stitchtiles: "stitchTiles",
  surfacescale: "surfaceScale",
  systemlanguage: "systemLanguage",
  tablevalues: "tableValues",
  targetx: "targetX",
  targety: "targetY",
  textlength: "textLength",
  viewbox: "viewBox",
  viewtarget: "viewTarget",
  xchannelselector: "xChannelSelector",
  ychannelselector: "yChannelSelector",
  zoomandpan: "zoomAndPan",
};

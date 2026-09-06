import { type Inspectable, NodeInspectSymbol } from "effect/Inspectable";
import { CouldNotFindRootElement, CouldNotFindTemplateEndError } from "../errors.js";
import type { HydrateContext } from "../HydrateContext.js";
import { getAllSiblingsBetween, isComment, isElement, toHtml } from "../Wire.js";

const TYPED_TEMPLATE_PREFIX = `t_`;
const TYPED_TEMPLATE_END_PREFIX = `/t_`;
const MANY_PREFIX = `/m_`;
const HOLE_PREFIX = `n_`;

export function getRendered(where: HydrationNode) {
  const nodes = getNodes(where);
  if (nodes.length === 1) return nodes[0];
  if (nodes.length > 1) {
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    // Use live hole contents after hydration, rather than the parsed SSR snapshot.
    return [first, ...getAllSiblingsBetween(first, last), last];
  }
  return nodes;
}

export function findHydrationTemplateByHash(
  hydrateCtx: HydrateContext,
  hash: string,
): HydrationTemplate | null {
  const { where, manyKey } = hydrateCtx;

  // If there is not a manyKey, we can just find the template by its hash
  if (manyKey === undefined) {
    return findHydrationTemplate(getChildNodes(where), hash);
  }

  // If there is a manyKey, we need to find the many node first
  const many = findHydrationMany(getChildNodes(where), manyKey);

  if (many === null) return null;

  // Then we can find the template by its hash
  return findHydrationTemplate(getChildNodes(many), hash);
}

export function getHydrationRoot(root: HTMLElement): HydrationElement {
  let hydrationNodes = getHydrationNodes(root.childNodes);

  // If your whole template is wrapped in a single hole, unwrap it.
  if (hydrationNodes.length === 1 && hydrationNodes[0]._tag === "hole") {
    hydrationNodes = getChildNodes(hydrationNodes[0]);
  }

  return new HydrationElement(root, hydrationNodes);
}

function getHydrationNodes(nodes: ArrayLike<Node>): Array<HydrationNode> {
  const out: Array<HydrationNode> = [];
  const frames: Array<HydrationFrame> = [{ nodes, index: 0, out, groups: [] }];

  while (frames.length > 0) {
    const frame = frames[frames.length - 1];
    if (frame.index >= frame.nodes.length) {
      const group = frame.groups[frame.groups.length - 1];
      if (group !== undefined) {
        if (group._tag === "template") throw new CouldNotFindTemplateEndError(group.hash);
        throw new CouldNotFindRootElement(group.index);
      }
      frames.pop();
      continue;
    }

    const node = frame.nodes[frame.index++];
    const current = getCurrentHydrationNodes(frame);
    if (isComment(node)) {
      const marker = node.data;
      const group = frame.groups[frame.groups.length - 1];

      if (group?._tag === "template" && marker === TYPED_TEMPLATE_END_PREFIX + group.hash) {
        frame.groups.pop();
        getCurrentHydrationNodes(frame).push(new HydrationTemplate(group.hash, group.childNodes));
      } else if (group?._tag === "hole" && marker === `/${HOLE_PREFIX}${group.index}`) {
        frame.groups.pop();
        getCurrentHydrationNodes(frame).push(
          new HydrationHole(group.index, group.startComment, node, group.childNodes),
        );
      } else if (marker.startsWith(TYPED_TEMPLATE_PREFIX)) {
        frame.groups.push({
          _tag: "template",
          hash: marker.slice(TYPED_TEMPLATE_PREFIX.length),
          childNodes: [],
        });
      } else if (marker.startsWith(MANY_PREFIX)) {
        const last = current.pop();
        current.push(new HydrationMany(marker.slice(MANY_PREFIX.length), node, last ? [last] : []));
      } else if (marker.startsWith(HOLE_PREFIX)) {
        frame.groups.push({
          _tag: "hole",
          index: parseInt(marker.slice(HOLE_PREFIX.length), 10),
          startComment: node,
          childNodes: [],
        });
      } else {
        current.push(new HydrationLiteral(node));
      }
    } else if (isElement(node)) {
      const childNodes: Array<HydrationNode> = [];
      current.push(new HydrationElement(node, childNodes));
      frames.push({ nodes: node.childNodes, index: 0, out: childNodes, groups: [] });
    } else {
      current.push(new HydrationLiteral(node));
    }
  }

  return out;
}

type HydrationGroup =
  | {
      readonly _tag: "template";
      readonly hash: string;
      readonly childNodes: Array<HydrationNode>;
    }
  | {
      readonly _tag: "hole";
      readonly index: number;
      readonly startComment: Comment;
      readonly childNodes: Array<HydrationNode>;
    };

type HydrationFrame = {
  readonly nodes: ArrayLike<Node>;
  index: number;
  readonly out: Array<HydrationNode>;
  readonly groups: Array<HydrationGroup>;
};

function getCurrentHydrationNodes(frame: HydrationFrame): Array<HydrationNode> {
  return frame.groups[frame.groups.length - 1]?.childNodes ?? frame.out;
}

export class HydrationElement implements Inspectable {
  readonly _tag = "element" as const;

  readonly parentNode: Element;
  readonly childNodes: Array<HydrationNode>;

  constructor(parentNode: Element, childNodes: Array<HydrationNode>) {
    this.parentNode = parentNode;
    this.childNodes = childNodes;
  }

  toJSON(): unknown {
    return {
      _tag: this._tag,
      parentNode: toHtml(this.parentNode),
      childNodes: this.childNodes.map((n) => n.toJSON()),
    };
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export class HydrationTemplate implements Inspectable {
  // A parsed SSR range belongs to one template instance, including equal-hash siblings.
  claimed = false;

  readonly _tag = "template" as const;

  readonly hash: string;
  readonly childNodes: Array<HydrationNode>;

  constructor(hash: string, childNodes: Array<HydrationNode>) {
    this.hash = hash;
    this.childNodes = childNodes;
  }

  toJSON(): unknown {
    return {
      _tag: this._tag,
      hash: this.hash,
      childNodes: this.childNodes.map((n) => n.toJSON()),
    };
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export type HydrationNode =
  | HydrationElement
  | HydrationTemplate
  | HydrationMany
  | HydrationHole
  | HydrationLiteral;

export class HydrationMany implements Inspectable {
  readonly _tag = "many" as const;

  readonly key: string;
  readonly comment: Comment;
  readonly childNodes: Array<HydrationNode>;

  constructor(key: string, comment: Comment, childNodes: Array<HydrationNode>) {
    this.key = key;
    this.comment = comment;
    this.childNodes = childNodes;
  }

  toJSON(): unknown {
    return {
      _tag: this._tag,
      key: this.key,
      childNodes: this.childNodes.map((n) => n.toJSON()),
    };
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export class HydrationHole implements Inspectable {
  readonly _tag = "hole" as const;

  readonly index: number;
  readonly startComment: Comment;
  readonly endComment: Comment;
  readonly childNodes: Array<HydrationNode>;

  constructor(
    index: number,
    startComment: Comment,
    endComment: Comment,
    childNodes: Array<HydrationNode>,
  ) {
    this.index = index;
    this.startComment = startComment;
    this.endComment = endComment;
    this.childNodes = childNodes;
  }

  toJSON(): unknown {
    return {
      _tag: this._tag,
      index: this.index,
      childNodes: this.childNodes.map((n) => n.toJSON()),
    };
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export class HydrationLiteral implements Inspectable {
  readonly _tag = "literal" as const;

  readonly node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  toJSON(): unknown {
    return {
      _tag: this._tag,
      node: toHtml(this.node),
    };
  }

  [NodeInspectSymbol]() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export function getChildNodes(node: HydrationNode): Array<HydrationNode> {
  switch (node._tag) {
    case "literal":
      return [];
    case "hole":
    case "element":
    case "template":
    case "many":
      return node.childNodes;
  }
}

export function findHydrationTemplate(
  nodes: Array<HydrationNode>,
  templateHash: string,
): HydrationTemplate | null {
  let index = 0;
  const toProcess: Array<HydrationNode> = [...nodes];

  while (index < toProcess.length) {
    const node = toProcess[index++];

    if (node._tag === "template" && node.hash === templateHash && !node.claimed) {
      return node;
    } else if (node._tag === "element") {
      const childNodes = node.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        toProcess.push(childNodes[i]);
      }
    }
  }

  return null;
}

export function findHydrationMany(nodes: Array<HydrationNode>, key: string): HydrationMany | null {
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i];
    if (node._tag === "many" && node.key === key) {
      return node;
    }
  }

  return null;
}

export function findHydrationHole(
  nodes: Array<HydrationNode>,
  index: number,
): HydrationHole | null {
  const toProcess = nodes.slice(0);
  while (toProcess.length > 0) {
    const node = toProcess.shift()!;
    if (node._tag === "hole" && node.index === index) {
      return node;
    } else if (node._tag === "element") {
      for (let childIndex = node.childNodes.length - 1; childIndex >= 0; childIndex--) {
        toProcess.push(node.childNodes[childIndex]);
      }
    }
  }

  return null;
}

export function findHydrationNode(
  node: HydrationNode,
  index: number,
  manyKey?: string,
): HydrationHole | HydrationMany | null {
  const childNodes = getChildNodes(node);
  const found =
    manyKey === undefined
      ? findHydrationHole(childNodes, index)
      : findHydrationMany(childNodes, manyKey);

  return found;
}

export function getNodes(node: HydrationNode): Array<Node> {
  return flattenHydrationNode(node, true);
}

export function getNodesExcludingStartComment(node: HydrationNode): Array<Node> {
  return flattenHydrationNode(node, false);
}

function flattenHydrationNode(node: HydrationNode, includeHoleStarts: boolean): Array<Node> {
  const out: Array<Node> = [];
  const toProcess: Array<FlattenTask> = [{ _tag: "hydration", node }];

  while (toProcess.length > 0) {
    const task = toProcess.pop()!;
    if (task._tag === "node") {
      out.push(task.node);
      continue;
    }

    const current = task.node;
    switch (current._tag) {
      case "element":
        out.push(current.parentNode);
        break;
      case "literal":
        out.push(current.node);
        break;
      case "hole":
        toProcess.push({ _tag: "node", node: current.endComment });
        pushHydrationNodes(toProcess, current.childNodes);
        if (includeHoleStarts) {
          toProcess.push({ _tag: "node", node: current.startComment });
        }
        break;
      case "many":
        toProcess.push({ _tag: "node", node: current.comment });
        pushHydrationNodes(toProcess, current.childNodes);
        break;
      case "template":
        pushHydrationNodes(toProcess, current.childNodes);
        break;
    }
  }

  return out;
}

type FlattenTask =
  | { readonly _tag: "hydration"; readonly node: HydrationNode }
  | { readonly _tag: "node"; readonly node: Node };

function pushHydrationNodes(
  toProcess: Array<FlattenTask>,
  nodes: ReadonlyArray<HydrationNode>,
): void {
  for (let index = nodes.length - 1; index >= 0; index--) {
    toProcess.push({ _tag: "hydration", node: nodes[index] });
  }
}

export const findHydratePath = (node: HydrationNode, path: ReadonlyArray<number>): Node => {
  if (path.length === 0) {
    return getNodesExcludingStartComment(node)[0];
  }

  // Parsed paths count each dynamic child position once, regardless of how
  // many concrete nodes its server output contains. The captured hydration
  // tree preserves those positions; walking childNodes would count that
  // output and its template markers as additional static siblings.
  let current = node;
  const start = node._tag === "element" || node._tag === "literal" ? 1 : 0;
  for (let i = start; i < path.length; i++) {
    const child = getChildNodes(current)[path[i]];
    if (child === undefined) throw new CouldNotFindRootElement(path[i]);
    current = child;
  }

  switch (current._tag) {
    case "element":
      return current.parentNode;
    case "literal":
      return current.node;
    case "hole":
      return current.endComment;
    case "many":
    case "template":
      return getNodesExcludingStartComment(current)[0];
  }
};

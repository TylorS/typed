// @see https://github.com/WebReflection/udomdiff

export interface DiffOperations<A> {
  readonly first: (entry: A) => Node;
  readonly last: (entry: A) => Node;
  readonly insert: (entry: A, before: Node | null) => void;
  readonly remove: (entry: A) => void;
}

export const diff = <A>(
  a: ReadonlyArray<A>,
  b: Array<A>,
  { first, last, insert, remove }: DiffOperations<A>,
  before: Node,
) => {
  const bLength = b.length;
  let aEnd = a.length;
  let bEnd = bLength;
  let aStart = 0;
  let bStart = 0;
  let map: Map<A, number> | undefined;
  while (aStart < aEnd || bStart < bEnd) {
    // append head, tail, or nodes in between: fast path
    if (aEnd === aStart) {
      // we could be in a situation where the rest of nodes that
      // need to be added are not at the end, and in such case
      // the node to `insertBefore`, if the index is more than 0
      // must be retrieved, otherwise it's gonna be the first item.
      const node =
        bEnd < bLength ? (bStart ? last(b[bStart - 1]).nextSibling : first(b[bEnd])) : before;
      while (bStart < bEnd) {
        insert(b[bStart++], node);
      }
    } // remove head or tail: fast path
    else if (bEnd === bStart) {
      while (aStart < aEnd) {
        // remove the node only if it's unknown or not live
        if (!map || !map.has(a[aStart])) {
          remove(a[aStart]);
        }
        aStart++;
      }
    } // same node: fast path
    else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
    } // same tail: fast path
    else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    } // The once here single last swap "fast path" has been removed in v1.1.0
    // https://github.com/WebReflection/udomdiff/blob/single-final-swap/esm/index.js#L69-L85
    // reverse swap: also fast path
    else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      // this is a "shrink" operation that could happen in these cases:
      // [1, 2, 3, 4, 5]
      // [1, 4, 3, 2, 5]
      // or asymmetric too
      // [1, 2, 3, 4, 5]
      // [1, 2, 3, 5, 6, 4]
      const node = last(a[--aEnd]).nextSibling;
      insert(b[bStart++], last(a[aStart++]).nextSibling);
      insert(b[--bEnd], node);
    } else if (!map && a[aStart] === b[bEnd - 1]) {
      // Rotate the head to the tail without moving the intervening entries.
      insert(a[aStart++], bEnd < bLength ? first(b[bEnd]) : before);
      bEnd--;
    } else if (!map && a[aEnd - 1] === b[bStart]) {
      // Rotate the tail to the head.
      insert(a[--aEnd], first(a[aStart]));
      bStart++;
    } // map based fallback, "slow" path
    else {
      // the map requires an O(bEnd - bStart) operation once
      // to store all future nodes indexes for later purposes.
      // In the worst case scenario, this is a full O(N) cost,
      // and such scenario happens at least when all nodes are different,
      // but also if both first and last items of the lists are different
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) {
          map.set(b[i], i++);
        }
      }

      const index = map.get(a[aStart]) ?? -1;

      // this node has no meaning in the future list, so it's more than safe
      // to remove it, and check the next live node out instead, meaning
      // that only the live list index should be forwarded
      if (index < 0) remove(a[aStart++]);
      // it's a future node, hence it needs some handling
      else {
        if (bStart < index && index < bEnd) {
          // Advance the target without detaching a retained source entry.
          // Each iteration consumes an entry: no repeated sequence scans.
          insert(b[bStart++], first(a[aStart]));
        } else {
          aStart++;
        }
      }
    }
  }
  return b;
};

export function insertOrMoveBefore(parentNode: ParentNode, node: Node, before: Node | null) {
  // If the node is already in the DOM, try to move it to preserve internal states of the node.
  // e.g. the internal states of a custom element.
  if (node === before || (node.parentNode === parentNode && node.nextSibling === before)) return;
  if (node.parentNode !== null && typeof parentNode.moveBefore === "function") {
    tryMoveBefore(parentNode, node, before);
  } else {
    parentNode.insertBefore(node, before);
  }
}

function tryMoveBefore(parentNode: ParentNode, node: Node, before: Node | null) {
  try {
    parentNode.moveBefore(node, before);
  } catch {
    parentNode.insertBefore(node, before);
  }
}

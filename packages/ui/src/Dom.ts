/**
 * DOM-first host, event, ref, prop-merging, and rendering contracts.
 *
 * @remarks
 * Typed components expose the platform DOM as their host API. Existing node
 * identity, unrelated class names/attributes, real DOM events, and web-standard
 * behavior remain available. Host render work and cleanup are owned by the
 * running Effect Scope.
 *
 * @since 1.0.0
 * @category DOM host contracts
 */
export * from "./Dom/index.js";

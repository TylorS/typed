/** Svelte's opaque HTML hydration retains server nodes; CSR starts empty. */
export function renderSnapshot(..._args: ReadonlyArray<unknown>): string {
  return "";
}

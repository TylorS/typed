/**
 * Constructor for creating readonly argument tuples.
 */
export type Args<A extends readonly any[]> = Readonly<A>

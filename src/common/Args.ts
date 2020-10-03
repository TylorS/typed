export type Args<A extends readonly any[]> = Readonly<A>

export type A = Args<[l: number, b: string]>

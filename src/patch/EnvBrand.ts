export const EnvBrand = '__ENV__' as const
export type EnvBrand = typeof EnvBrand

export type EnvBrandOf<A> = EnvBrand extends keyof A ? A[EnvBrand] : unknown

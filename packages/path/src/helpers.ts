export type RemoveLeadingSlash<Path extends string> = Path extends `/${infer Tail}`
  ? RemoveLeadingSlash<Tail>
  : Path

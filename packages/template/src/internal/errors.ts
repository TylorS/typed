export class CouldNotFindCommentError extends Error {
  constructor(readonly partIndex: number) {
    super(`Could not find comment for part ${partIndex}`)
  }
}

export class CouldNotFindRootElement extends Error {
  constructor(readonly partIndex: number) {
    super(`Could not find root elements for part ${partIndex}`)
  }
}

export class CouldNotFindManyCommentError extends Error {
  constructor(readonly manyIndex: string) {
    super(`Could not find comment for many part ${manyIndex}`)
  }
}

export class CouldNotFindTemplateHashError extends Error {
  constructor(readonly hash: string) {
    super(`Could not find template hash ${hash}`)
  }
}

export class CouldNotFindTemplateEndError extends Error {
  constructor(readonly hash: string) {
    super(`Could not find end of template for hash ${hash}`)
  }
}

const constructors: Array<Function> = [
  CouldNotFindCommentError,
  CouldNotFindRootElement,
  CouldNotFindManyCommentError,
  CouldNotFindTemplateHashError,
  CouldNotFindTemplateEndError
]

export function isHydrationError(
  e: unknown
): e is
  | CouldNotFindCommentError
  | CouldNotFindRootElement
  | CouldNotFindManyCommentError
  | CouldNotFindTemplateHashError
  | CouldNotFindTemplateEndError
{
  return constructors.some((c) => e instanceof c)
}

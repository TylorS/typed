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

export function isHydrationError(e: unknown): e is CouldNotFindCommentError | CouldNotFindRootElement {
  return e instanceof CouldNotFindCommentError || e instanceof CouldNotFindRootElement
}

export class VirtualModule {
  constructor(
    readonly id: string,
    readonly code: string,
    readonly filePath: string,
    readonly dependencies: ReadonlyArray<string>,
  ) {}
}

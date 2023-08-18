export interface HtmlModule {
  readonly content: string
  readonly placeholder: RegExp
  readonly before: string
  readonly after: string
  readonly basePath: string | null
  readonly assetDirectory: string
}

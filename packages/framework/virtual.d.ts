declare module 'typed:config' {
  export const sourceDirectory: string

  export const tsConfig: string

  export const serverFilePath: string

  export const clientOutputDirectory: string

  export const serverOutputDirectory: string

  export const htmlFiles: readonly string[]

  export const debug: boolean

  export const saveGeneratedModules: boolean

  export const base: string

  export const assetDirectory: string
}

declare module 'html:*' {
  export const content: string
  export const placeholder: RegExp
  export const before: string
  export const after: string
  export const basePath: string | null
  export const assetDirectory: string
}

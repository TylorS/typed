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
}

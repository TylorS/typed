import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      sourceMap: false,
      declaration: false,
      declarationMap: false,
      inlineSourceMap: true,
      inlineSources: true,
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
  })

  return project
}

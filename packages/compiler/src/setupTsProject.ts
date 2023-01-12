import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      composite: false,
      sourceMap: true,
      declaration: false,
      declarationMap: false,
      inlineSourceMap: false,
      inlineSources: false,
    },
  })

  return project
}

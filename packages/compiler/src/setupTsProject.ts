import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      composite: false,
      sourceMap: false,
      declaration: false,
      declarationMap: false,
      inlineSourceMap: true,
      inlineSources: true,
    },
  })

  return project
}

import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  const project = new Project({
    tsConfigFilePath,
    compilerOptions: {
      sourceMap: false,
      inlineSourceMap: true,
    },
  })

  return project
}

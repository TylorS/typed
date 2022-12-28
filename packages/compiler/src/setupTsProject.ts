import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  const project = new Project({ tsConfigFilePath })

  return project
}

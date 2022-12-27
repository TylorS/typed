import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  return new Project({ tsConfigFilePath })
}

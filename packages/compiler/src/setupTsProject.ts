import { Project } from 'ts-morph'

export function setupTsProject(tsConfigFilePath: string) {
  // TODO: Add support for tsconfig-paths

  return new Project({ tsConfigFilePath })
}

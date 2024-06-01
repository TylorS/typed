import ts from "typescript"

export function findTsConfig(directory: string, fileName?: string): ts.ParsedCommandLine {
  const configPath = ts.findConfigFile(directory, ts.sys.fileExists, fileName)

  if (!configPath) {
    throw new Error(`Could not find a valid 'tsconfig.json' file in '${directory}'`)
  }

  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, directory, undefined, configPath)

  return parsed
}

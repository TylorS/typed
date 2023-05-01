export interface Options {
  readonly base: string
  readonly cwd: string
  readonly build: Build
  readonly output: Output
  readonly tsConfig: string
}

export interface Build {
  readonly mode: BuildMode
  readonly type: BuildType
}

export enum BuildType {
  Browser = 'browser',
  Server = 'server',
  Static = 'static',
}

export enum BuildMode {
  Development = 'development',
  Production = 'production',
}

export interface Output {
  readonly client: string
  readonly server: string
  readonly static: string
}

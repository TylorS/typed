import { dirname, join } from 'path'

import { Service, setupProject } from './packages/virtual/src/index.js'

const service = new Service()
const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)
const exampleDirectory = join(__dirname, 'example')

const project = setupProject(service, exampleDirectory, 'tsconfig.json')

console.log(project.emit())

import { join } from 'path'

import { Service, setupProject } from './packages/virtual/src/api'

const service = new Service()
const exampleDirectory = join(__dirname, 'example')

const project = setupProject(service, exampleDirectory, 'tsconfig.json')

console.log(project.validate())

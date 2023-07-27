import { readFileSync } from 'fs'
import { join } from 'path'

const exampleDirectory = join(__dirname, 'example')
const indexHtml = join(exampleDirectory, 'index.html')
const content = readFileSync(indexHtml).toString()
const regex = /<!--\s+?TYPED_CONTENT\s+?-->/

console.log(content.split(regex).filter((x) => x !== ''))

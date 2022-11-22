import * as path from 'path'

import * as devkit from '@nrwl/devkit'

interface NormalizedSchema {
  name: string
  projectName: string
  projectRoot: string
}

function normalizeOptions(tree: devkit.Tree, options: { name: string }): NormalizedSchema {
  const name = devkit.names(options.name).fileName
  const projectName = name.replace(new RegExp('/', 'g'), '-')
  const projectRoot = `${devkit.getWorkspaceLayout(tree).libsDir}/${name}`

  return {
    ...options,
    projectName,
    projectRoot,
  }
}

function addFiles(tree: devkit.Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...devkit.names(options.name),
    offsetFromRoot: devkit.offsetFromRoot(options.projectRoot),
    template: '',
  }
  devkit.generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions)
}
export default async function (tree: devkit.Tree, options: { name: string }) {
  const normalizedOptions = normalizeOptions(tree, options)
  addFiles(tree, normalizedOptions)
  await devkit.formatFiles(tree)

  return () => {
    devkit.installPackagesTask(tree)
  }
}

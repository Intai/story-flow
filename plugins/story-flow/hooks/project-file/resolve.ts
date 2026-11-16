// Where a path a prompt names may sit: an @-mention is relative to the repository's top, which can
// be any folder above the session's root, so each one from the root up is a candidate.
export function candidatePaths(root: string, path: string): string[] {
  if (path.startsWith('/')) return [path]

  const folders = root.split('/').filter(part => part !== '')

  return folders
    .map((_, index) => `/${folders.slice(0, folders.length - index).join('/')}`)
    .concat('')
    .map(folder => `${folder}/${path}`)
}

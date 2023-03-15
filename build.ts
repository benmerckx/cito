import {build} from 'esbuild'
import {globSync} from 'glob'

const entryPoints = 'src/**/*.ts'
const outdir = 'dist'
await build({
  format: 'esm',
  target: 'esnext',
  entryPoints: globSync(entryPoints),
  outdir,
  minify: true
})

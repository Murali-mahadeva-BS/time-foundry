import * as esbuild from 'esbuild'
import { mkdirSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const extensionRoot = resolve(scriptDir, '..')
const outDir = resolve(extensionRoot, 'dist', 'extension')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [resolve(extensionRoot, 'extension', 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode'],
  outfile: resolve(outDir, 'extension.js'),
  logLevel: 'info',
})

import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const svgData = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')

for (const size of [16, 48, 128]) {
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
  })
  const png = resvg.render().asPng()
  writeFileSync(resolve(root, `public/icons/icon${size}.png`), png)
  console.log(`Generated icon${size}.png`)
}

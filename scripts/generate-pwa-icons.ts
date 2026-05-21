import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const svg = readFileSync(join(publicDir, 'favicon.svg'))

const sizes = [192, 512] as const

const renderIcon = (size: number) =>
  sharp(svg, { density: Math.ceil(size / 32) * 72 }).resize(size, size).png()

for (const size of sizes) {
  const out = join(publicDir, `icon-${size}.png`)
  await renderIcon(size).toFile(out)

  console.log(`  ${out.replace(`${root}/`, '')}`)
}

const faviconIco = join(publicDir, 'favicon.ico')
await renderIcon(32).toFile(faviconIco)
console.log(`  ${faviconIco.replace(`${root}/`, '')}`)

console.log('PWA icons generated.')

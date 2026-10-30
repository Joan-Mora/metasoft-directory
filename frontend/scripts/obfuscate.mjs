/**
 * © Joan Mora — Proprietary. See LICENSE.
 * Post-build obfuscation of production JS bundles.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JavaScriptObfuscator from 'javascript-obfuscator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../dist/assets')

if (!fs.existsSync(assetsDir)) {
  console.warn('No dist/assets — skip obfuscation')
  process.exit(0)
}

for (const file of fs.readdirSync(assetsDir)) {
  if (!file.endsWith('.js')) continue
  const full = path.join(assetsDir, file)
  const code = fs.readFileSync(full, 'utf8')
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayThreshold: 0.5,
    renameGlobals: false,
    sourceMap: false,
  })
  fs.writeFileSync(full, result.getObfuscatedCode())
  console.log('Obfuscated', file)
}

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  ['pl-10 pr-4 py-2 w-full bg-elevated/50 border border-border rounded-xl', 'pl-10 pr-4 py-2 w-full input-field rounded-xl'],
  ['w-full pl-10 pr-4 py-2 bg-elevated/50 border border-border rounded-xl', 'w-full pl-10 pr-4 py-2 input-field rounded-xl'],
  ['px-4 py-2 bg-elevated/50 border border-border rounded-xl', 'px-4 py-2 input-field rounded-xl'],
  ['px-3 py-2 bg-elevated/50 border border-border rounded-lg', 'px-3 py-2 input-field rounded-lg'],
  ['px-3 py-1.5 rounded-lg bg-elevated/50 border border-border', 'px-3 py-1.5 rounded-lg input-field'],
  ['bg-elevated/50 border border-border rounded-lg px-3 py-2', 'input-field rounded-lg px-3 py-2'],
  ['bg-elevated/30 border border-border rounded-2xl', 'card border-border rounded-2xl'],
  ['rounded-2xl border border-border bg-elevated/30 overflow-hidden', 'card overflow-hidden'],
  ['bg-elevated/30 border border-border', 'bg-surface border border-border shadow-sm'],
  ['bg-elevated/50 border border-border', 'bg-surface border border-border shadow-sm'],
  ['border border-border bg-elevated/50', 'border border-border bg-surface shadow-sm'],
  ['bg-elevated/50 rounded-xl', 'bg-hover rounded-xl'],
  ['bg-elevated/50 rounded-lg', 'bg-hover rounded-lg'],
  ['bg-elevated/50 rounded-2xl', 'bg-hover rounded-2xl'],
  ['bg-elevated/50 rounded-full', 'bg-hover rounded-full'],
  ['bg-elevated/50 animate-pulse', 'bg-hover animate-pulse'],
  ['bg-elevated/50 text-muted', 'bg-hover text-muted'],
  ['bg-elevated/50 flex', 'bg-hover flex'],
  ['bg-elevated/50 p-', 'bg-hover p-'],
  ['bg-elevated/50 uppercase', 'input-field uppercase'],
  ['bg-elevated/50 transition', 'bg-hover transition'],
  ['bg-elevated/50 cursor', 'bg-hover cursor'],
  ['bg-elevated/50 hover', 'bg-hover hover'],
  ['bg-elevated/50 disabled', 'bg-hover disabled'],
  ['bg-elevated/50 focus', 'input-field focus'],
  ['bg-elevated/50 placeholder', 'input-field placeholder'],
  ['bg-elevated/50 w-', 'input-field w-'],
  ['bg-elevated/50 h-', 'bg-hover h-'],
  ['bg-elevated/50 mb-', 'bg-hover mb-'],
  ['bg-elevated/50 border-2', 'bg-surface border-2'],
  ['bg-elevated/50 gap-', 'bg-hover gap-'],
  ['bg-elevated/50 space', 'bg-hover space'],
  ['bg-elevated/50 grid', 'bg-hover grid'],
  ['bg-elevated/50 items', 'bg-hover items'],
  ['bg-elevated/50 justify', 'bg-hover justify'],
  ['bg-elevated/50 text-center', 'input-field text-center'],
  ['bg-elevated/50 text-sm', 'input-field text-sm'],
  ['bg-elevated/50 text-lg', 'input-field text-lg'],
  ['bg-elevated/50 outline', 'input-field outline'],
  ['bg-elevated/50 sm:', 'input-field sm:'],
  ['thead className="bg-elevated/50', 'thead className="bg-hover'],
  ['bg-elevated/50', 'bg-hover'],
  ['bg-elevated/30', 'bg-surface'],
  ['bg-elevated/40', 'bg-hover'],
  ['border-border bg-elevated/50', 'border-border bg-surface shadow-sm'],
  ['rounded-xl border border-border bg-elevated/50', 'rounded-xl card'],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(jsx|tsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, 'utf8')
  let next = content
  for (const [from, to] of replacements) {
    next = next.split(from).join(to)
  }
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8')
    changed++
    console.log('updated:', path.relative(srcDir, file))
  }
}

console.log(`\nDone. ${changed} files polished (pass 2).`)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  ['rounded-2xl border border-border bg-elevated/30 p-6', 'card p-6'],
  ['rounded-2xl border border-border bg-surface/50 p-6', 'card p-6'],
  ['rounded-xl border border-border bg-elevated/30 p-6', 'card p-6'],
  ['rounded-xl border border-border bg-surface/50 p-6', 'card p-6'],
  ['p-5 rounded-xl bg-elevated/30 border border-border', 'p-5 rounded-xl card'],
  ['p-6 rounded-xl bg-surface/50 border border-border', 'p-6 rounded-xl card'],
  ['p-6 rounded-xl bg-elevated/30 border border-border', 'p-6 rounded-xl card'],
  ['bg-elevated/50 border border-border rounded-lg px-3 py-2 text-foreground', 'input-field rounded-lg px-3 py-2'],
  ['bg-elevated/50 border border-border rounded-xl text-foreground', 'input-field rounded-xl'],
  ['bg-surface/50 border border-border rounded-xl text-sm text-foreground', 'input-field rounded-xl text-sm'],
  ['pl-10 pr-4 py-2 w-full bg-surface/50 border border-border rounded-xl', 'pl-10 pr-4 py-2 w-full input-field rounded-xl'],
  ['pl-10 pr-4 py-2 bg-surface/50 border border-border rounded-xl', 'pl-10 pr-4 py-2 input-field rounded-xl'],
  ['w-full px-4 py-3 bg-elevated/50 border border-border rounded-xl', 'w-full px-4 py-3 input-field rounded-xl'],
  ['w-full px-4 py-2.5 bg-elevated/50 border border-border rounded-lg', 'w-full px-4 py-2.5 input-field rounded-lg'],
  ['w-full pl-10 pr-4 py-2.5 bg-elevated/50 border border-border rounded-lg', 'w-full pl-10 pr-4 py-2.5 input-field rounded-lg'],
  ['w-full pl-10 pr-4 py-2.5 bg-surface/50 border border-border rounded-lg', 'w-full pl-10 pr-4 py-2.5 input-field rounded-lg'],
  ['hover:bg-elevated/50', 'hover:bg-hover'],
  ['hover:bg-elevated/80', 'hover:bg-hover'],
  ['hover:bg-elevated/40', 'hover:bg-hover'],
  ['hover:bg-surface/50', 'hover:bg-hover'],
  ['bg-elevated border border-border rounded-2xl shadow-2xl', 'dropdown-panel shadow-dropdown'],
  ['bg-elevated border border-border rounded-2xl max-h', 'bg-surface border border-border rounded-2xl shadow-dropdown max-h'],
  ['${notification.isRead ? \'opacity-60\' : \'bg-elevated/30\'}', "${notification.isRead ? 'opacity-60' : 'bg-hover'}"],
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

console.log(`\nDone. ${changed} files polished.`)

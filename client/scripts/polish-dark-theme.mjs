import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  ['disabled:opacity-50 disabled:cursor-not-allowed', 'disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none'],
  ['disabled:opacity-50', 'disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none'],
  ['disabled:opacity-60', 'disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none'],
  ['<thead className="bg-hover border-b border-border">', '<thead className="table-header">'],
  ['<thead className="bg-elevated/90 border-b border-border">', '<thead className="table-header">'],
  ['bg-overlay/30 backdrop-blur', 'bg-overlay/50 backdrop-blur'],
  ['bg-overlay/40 backdrop-blur', 'bg-overlay/50 backdrop-blur'],
  ['animate-pulse rounded-lg bg-hover', 'skeleton'],
  ['animate-pulse rounded-xl bg-hover', 'skeleton rounded-xl'],
  ['animate-pulse rounded-2xl bg-hover', 'skeleton rounded-2xl'],
  ['bg-hover animate-pulse rounded', 'skeleton rounded'],
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
  if (file.includes('Skeleton.jsx')) continue
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

console.log(`\nDone. ${changed} files polished for dark theme.`)

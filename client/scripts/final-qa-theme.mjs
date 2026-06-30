import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  // Primary buttons → btn-primary
  ['flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700', 'btn-primary w-full py-3 text-sm gap-2'],
  ['flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700', 'btn-primary w-full py-3 text-sm gap-2'],
  ['w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700', 'btn-primary w-full py-3 text-sm'],
  ['flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors', 'btn-primary px-4 py-2 gap-2'],
  ['px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors', 'btn-primary px-4 py-2'],
  ['flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm', 'btn-primary px-3 py-2 text-sm gap-2'],
  ['flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors', 'btn-primary px-3 py-2 gap-2'],
  ['flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all', 'btn-primary px-4 py-2 text-sm gap-2'],
  ['flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all', 'btn-primary flex-1 px-4 py-2.5 text-sm'],
  ['flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm disabled:bg-disabled', 'btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled'],
  ['flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-disabled', 'btn-primary flex-1 px-4 py-3 rounded-xl disabled:bg-disabled'],
  ['px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:bg-disabled', 'btn-primary px-4 py-2 gap-2 disabled:bg-disabled'],
  ['px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:bg-disabled', 'btn-primary px-4 py-2 disabled:bg-disabled'],
  ['px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-disabled', 'btn-primary px-3 py-2 disabled:bg-disabled'],
  ['flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium', 'btn-primary flex-1 py-2 px-4 text-sm'],
  ['flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs whitespace-nowrap', 'btn-primary px-3 py-1.5 text-xs gap-1 whitespace-nowrap'],
  ['flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all disabled:bg-disabled', 'btn-primary flex-1 px-4 py-2.5 text-sm disabled:bg-disabled'],
  ['? \'bg-indigo-600 text-white\'', '? \'btn-primary text-primary-foreground\''],
  ['? \'bg-indigo-500 text-white\'', '? \'bg-primary text-primary-foreground\''],

  // Focus rings → semantic
  ['focus:border-indigo-500/50', 'focus:border-primary/50'],
  ['focus:border-indigo-500', 'focus:border-primary/50'],
  ['focus:ring-indigo-500/40', 'focus:ring-ring/40'],
  ['focus:ring-indigo-500/50', 'focus:ring-ring/50'],
  ['focus:ring-indigo-500', 'focus:ring-ring'],
  ['focus:ring-1 focus:ring-indigo-500/40', 'focus:ring-1 focus:ring-ring/40'],
  ['text-indigo-600', 'text-primary'],
  ['text-indigo-400', 'text-primary'],
  ['text-indigo-300', 'text-primary/80'],
  ['hover:text-indigo-400', 'hover:text-primary'],
  ['hover:text-indigo-300', 'hover:text-primary/80'],
  ['bg-indigo-500/20 text-indigo-400', 'bg-primary/15 text-primary'],
  ['bg-indigo-600 text-white text-xs rounded-full', 'bg-primary text-primary-foreground text-xs rounded-full'],

  // Inputs
  ['w-full px-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50', 'w-full px-4 py-3 input-field rounded-xl placeholder:text-muted'],
  ['w-full px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50', 'w-full px-3 py-2 input-field rounded-lg text-sm'],
  ['pl-10 pr-4 py-2 w-full bg-surface/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50', 'pl-10 pr-4 py-2 w-full input-field rounded-xl text-sm placeholder:text-muted'],
  ['bg-surface/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50', 'input-field rounded-lg text-sm'],
  ['bg-surface/50 text-muted border border-border hover:text-foreground', 'bg-elevated text-muted border border-border hover:bg-hover hover:text-foreground'],

  // Secondary buttons
  ['px-4 py-2 rounded-lg bg-elevated border border-border text-foreground text-sm hover:bg-elevated transition-all disabled:bg-disabled', 'btn-secondary px-4 py-2 text-sm disabled:bg-disabled'],
  ['flex-1 px-4 py-3 bg-surface/50 text-foreground rounded-xl hover:bg-surface transition-colors', 'btn-secondary flex-1 px-4 py-3 rounded-xl'],
  ['flex-1 px-4 py-3 bg-elevated text-foreground rounded-xl hover:bg-elevated transition-colors', 'btn-secondary flex-1 px-4 py-3 rounded-xl'],

  // Settings panels
  ['p-4 rounded-lg bg-surface/50 border border-border', 'p-4 rounded-lg bg-elevated border border-border'],
  ['p-6 rounded-xl bg-surface/50 border border-border', 'p-6 rounded-xl card'],
  ['p-8 rounded-xl bg-surface/50 border border-border animate-pulse', 'p-8 rounded-xl card'],

  // Skeletons
  ['animate-pulse rounded-md bg-elevated', 'skeleton rounded-md'],
  ['animate-pulse rounded-xl bg-elevated', 'skeleton rounded-xl'],
  ['h-10 w-10 animate-pulse rounded-xl bg-elevated', 'h-10 w-10 skeleton rounded-xl'],
  ['flex gap-3 p-3 animate-pulse', 'flex gap-3 p-3'],
  ['rounded-xl bg-hover animate-pulse flex', 'skeleton rounded-xl flex'],
  ['p-6 rounded-xl bg-surface border border-border shadow-sm animate-pulse', 'card p-6'],
  ['card p-6 animate-pulse', 'card p-6'],
  ['flex gap-4 p-4 rounded-xl bg-hover animate-pulse', 'flex gap-4 p-4 rounded-xl'],
  ['flex items-center justify-between p-4 bg-hover rounded-xl animate-pulse', 'flex items-center justify-between p-4 skeleton rounded-xl'],

  // Heatmap legend
  ['bg-indigo-900', 'bg-primary/40'],
  ['bg-indigo-700', 'bg-primary/60'],
  ['bg-indigo-500', 'bg-primary'],
  ['bg-indigo-400', 'bg-primary/80'],

  // Misc
  ['shadow-2xl', 'shadow-dropdown'],
  ['min-w-[18px] h-[18px] px-1 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white', 'min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground'],
  ['w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg', 'w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg'],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(jsx|tsx|js)$/.test(entry.name) && !entry.name.endsWith('.test.js')) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(srcDir)) {
  if (file.includes('designTokens.js')) continue
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

console.log(`\nDone. ${changed} files updated.`)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  // Longer patterns first
  ['bg-[rgb(var(--surface))]', 'bg-surface'],
  ['bg-[rgb(var(--elevated))]', 'bg-elevated'],
  ['bg-[rgb(var(--canvas))]', 'bg-canvas'],
  ['text-[rgb(var(--foreground))]', 'text-foreground'],
  ['text-[rgb(var(--muted))]', 'text-muted'],
  ['border-[rgb(var(--border))]', 'border-border'],
  ['border-[rgb(var(--border))]/50', 'border-border/50'],
  ['border-[rgb(var(--border))]/60', 'border-border/60'],
  ['border-[rgb(var(--border))]/80', 'border-border/80'],
  ['bg-white/[0.03]', 'bg-elevated/30'],
  ['border-white/[0.08]', 'border-border'],
  ['border-white/[0.06]', 'border-border'],
  ['bg-[#0f0f0f]', 'bg-surface'],
  ['bg-[#1a1a1a]', 'bg-elevated'],
  ['bg-[#111]', 'bg-surface'],
  ['bg-[#0a0a0a]', 'bg-canvas'],
  ['bg-black/80', 'bg-overlay/80'],
  ['bg-black/60', 'bg-overlay/60'],
  ['bg-black/50', 'bg-overlay/50'],
  ['bg-black/40', 'bg-overlay/40'],
  ['bg-black/30', 'bg-overlay/30'],
  ['bg-black/20', 'bg-overlay/20'],
  ['bg-black', 'bg-canvas'],
  ['bg-gray-950', 'bg-canvas'],
  ['bg-gray-900', 'bg-surface'],
  ['bg-gray-900/50', 'bg-surface/50'],
  ['bg-gray-900/80', 'bg-surface/80'],
  ['bg-gray-800', 'bg-elevated'],
  ['bg-gray-800/50', 'bg-elevated/50'],
  ['bg-zinc-950', 'bg-canvas'],
  ['bg-zinc-900', 'bg-surface'],
  ['bg-zinc-900/50', 'bg-surface/50'],
  ['bg-zinc-900/80', 'bg-surface/80'],
  ['bg-zinc-800', 'bg-elevated'],
  ['bg-zinc-800/50', 'bg-elevated/50'],
  ['bg-zinc-700', 'bg-elevated'],
  ['border-white/10', 'border-border'],
  ['border-white/20', 'border-border'],
  ['border-white/5', 'border-border/50'],
  ['border-gray-700', 'border-border'],
  ['border-gray-800', 'border-border'],
  ['border-zinc-700', 'border-border'],
  ['border-zinc-800', 'border-border'],
  ['hover:bg-white/20', 'hover:bg-elevated'],
  ['hover:bg-white/10', 'hover:bg-elevated/80'],
  ['hover:bg-white/5', 'hover:bg-elevated/50'],
  ['bg-white/10', 'bg-elevated'],
  ['bg-white/5', 'bg-elevated/50'],
  ['bg-white/20', 'bg-elevated'],
  ['text-gray-600', 'text-muted'],
  ['text-gray-500', 'text-muted'],
  ['text-gray-400', 'text-muted'],
  ['text-gray-300', 'text-muted'],
  ['text-zinc-500', 'text-muted'],
  ['text-zinc-400', 'text-muted'],
  ['text-zinc-300', 'text-muted'],
  ['text-zinc-200', 'text-foreground/90'],
  ['text-zinc-100', 'text-foreground'],
  ['placeholder-gray-500', 'placeholder:text-muted'],
  ['placeholder-zinc-500', 'placeholder:text-muted'],
  ['divide-white/10', 'divide-border'],
  ['divide-gray-800', 'divide-border'],
  ['ring-white/10', 'ring-border'],
  ['bg-white/[0.06]', 'bg-elevated/40'],
  ['hover:bg-white/[0.05]', 'hover:bg-elevated/50'],
  ['hover:bg-white/[0.08]', 'hover:bg-elevated/80'],
  ['hover:bg-white/[0.06]', 'hover:bg-elevated/60'],
  ['hover:border-white/[0.12]', 'hover:border-border'],
  ['hover:border-white/40', 'hover:border-border'],
  ['border-white/15', 'border-border'],
  ['bg-[#0f172a]', 'bg-surface'],
  ['bg-[#262626]', 'bg-elevated'],
  ['bg-gray-700', 'bg-elevated'],
  ['bg-gray-600', 'bg-muted/50'],
  ['border-[#0f0f0f]', 'border-canvas'],
  ['bg-gray-500/10', 'bg-elevated/50'],
  ['border-gray-500/20', 'border-border'],
  ['text-gray-200', 'text-foreground/90'],
  ['bg-[rgb(var(--primary))]', 'bg-primary'],
  ['text-[rgb(var(--primary))]', 'text-primary'],
  ['text-[rgb(var(--primary-fg))]', 'text-primary-foreground'],
  ['bg-[rgb(var(--border))]', 'bg-border'],
  ['border-[rgb(var(--primary))]', 'border-primary'],
  ['border-[rgb(var(--foreground))]', 'border-foreground'],
  ['from-[rgb(var(--surface))]', 'from-surface'],
  ['to-[rgb(var(--surface))]', 'to-surface'],
  ['focus:border-[rgb(var(--primary))]/50', 'focus:border-primary/50'],
  ['accent-[rgb(var(--primary))]', 'accent-primary'],
  ['bg-[rgb(var(--muted))]/10', 'bg-muted/10'],
]

// text-white -> text-foreground, but preserve on colored buttons
const preserveTextWhite =
  /(?:bg-(?:indigo|violet|purple|blue|red|green|emerald|amber|orange|rose|primary)-(?:\d{3}|DEFAULT)|from-indigo|to-indigo)/

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(jsx|tsx|js|ts)$/.test(entry.name)) files.push(full)
  }
  return files
}

function migrateContent(content) {
  let result = content
  for (const [from, to] of replacements) {
    result = result.split(from).join(to)
  }

  // Replace text-white only when not on primary/colored action surfaces
  result = result.replace(/\btext-white\b/g, (match, offset) => {
    const before = result.slice(Math.max(0, offset - 120), offset)
    const after = result.slice(offset, offset + 80)
    const context = before + after
    if (preserveTextWhite.test(context)) return match
    if (/text-primary-foreground/.test(context)) return match
    return 'text-foreground'
  })

  return result
}

let changed = 0
for (const file of walk(srcDir)) {
  const original = fs.readFileSync(file, 'utf8')
  const migrated = migrateContent(original)
  if (migrated !== original) {
    fs.writeFileSync(file, migrated, 'utf8')
    changed++
    console.log('updated:', path.relative(srcDir, file))
  }
}

console.log(`\nDone. ${changed} files updated.`)

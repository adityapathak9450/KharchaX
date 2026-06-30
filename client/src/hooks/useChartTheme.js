import { useMemo } from 'react'
import { useThemeStore } from '../store/themeStore'

function readRgbToken(name) {
  if (typeof window === 'undefined') return ''
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim()
  return raw ? `rgb(${raw})` : ''
}

export function useChartTheme() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  return useMemo(() => {
    const grid = readRgbToken('chart-grid')
    const axis = readRgbToken('chart-axis')
    const tooltipBg = readRgbToken('chart-tooltip-bg')
    const tooltipBorder = readRgbToken('chart-tooltip-border')
    const tooltipText = readRgbToken('chart-tooltip-text')
    const legend = readRgbToken('chart-legend')

    const tooltipShadow = isDark
      ? '0 0 0 1px rgb(255 255 255 / 0.07), 0 12px 32px rgb(0 0 0 / 0.55)'
      : '0 4px 12px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.04)'

    return {
      gridProps: {
        strokeDasharray: '3 3',
        stroke: grid,
        strokeOpacity: isDark ? 0.55 : 0.75,
      },
      axisProps: {
        stroke: axis,
        tick: { fill: axis, fontSize: 11 },
        axisLine: { stroke: grid },
      },
      yAxisProps: {
        stroke: axis,
        tick: { fill: axis, fontSize: 11 },
        axisLine: { stroke: grid },
      },
      tooltipProps: {
        contentStyle: {
          backgroundColor: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: tooltipShadow,
        },
        labelStyle: { color: tooltipText, fontWeight: 500 },
        itemStyle: { color: tooltipText },
      },
      legendProps: {
        wrapperStyle: { color: legend, fontSize: '12px', paddingTop: '8px' },
      },
    }
  }, [isDark])
}

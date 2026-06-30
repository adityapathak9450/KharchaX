import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useChartTheme } from '../../hooks/useChartTheme'
import { CHART_COLORS } from '../../lib/designTokens'

export function SpendingChart({ data = [] }) {
  const { tooltipProps } = useChartTheme()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipProps} />
      </PieChart>
    </ResponsiveContainer>
  )
}

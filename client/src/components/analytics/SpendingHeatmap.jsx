import React, { useState } from 'react';

const SpendingHeatmap = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate last 90 days array
  const generateDaysArray = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const daysArray = generateDaysArray();
  
  // Find max amount for color scale
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  
  // Map intensity to color
  const getColor = (amount) => {
    if (amount === 0) return 'bg-hover';
    const intensity = amount / maxAmount;
    
    if (intensity < 0.25) return 'bg-primary/40';
    if (intensity < 0.5) return 'bg-primary/60';
    if (intensity < 0.75) return 'bg-primary';
    return 'bg-primary/80';
  };

  // Get amount for a specific date
  const getAmountForDate = (date) => {
    const dayData = data.find(d => d.date === date);
    return dayData?.amount || 0;
  };

  // Handle mouse events
  const handleMouseEnter = (date, event) => {
    const amount = getAmountForDate(date);
    if (amount > 0) {
      const rect = event.target.getBoundingClientRect();
      setTooltip({
        date,
        amount,
      });
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Build weeks array (13 weeks for 90 days)
  const buildWeeks = () => {
    const weeks = [];
    let currentWeek = [];
    
    daysArray.forEach((date, index) => {
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6
      
      currentWeek[adjustedDayOfWeek] = date;
      
      if (adjustedDayOfWeek === 6 || index === daysArray.length - 1) {
        // End of week or last day
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    });
    
    return weeks;
  };

  const weeks = buildWeeks();

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex mb-2 ml-8">
        {weeks.map((week, weekIndex) => {
          if (weekIndex % 4 === 0) {
            const firstDay = week.find(day => day !== null);
            if (firstDay) {
              const month = new Date(firstDay).toLocaleString('default', { month: 'short' });
              return (
                <div key={weekIndex} className="flex-1 text-xs text-muted">
                  {month}
                </div>
              );
            }
          }
          return <div key={weekIndex} className="flex-1" />;
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {['M', 'W', 'F'].map((day, index) => (
            <div key={index} className="h-3 w-4 flex items-center justify-center text-xs text-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className="w-3 h-3" />;
                }

                const amount = getAmountForDate(day);
                const colorClass = getColor(amount);

                return (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary ${colorClass}`}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 ml-8">
        <span className="text-xs text-muted">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-hover" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
        </div>
        <span className="text-xs text-muted">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-surface border border-border shadow-dropdown rounded-lg px-3 py-2 text-sm pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-foreground font-medium">
            {new Date(tooltip.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-muted">
            ₹{tooltip.amount.toLocaleString('en-IN')}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingHeatmap;

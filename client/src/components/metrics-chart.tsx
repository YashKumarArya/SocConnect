import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  value: number | string;
  category?: string;
}

interface MetricsChartProps {
  data: ChartData[];
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  className?: string;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
}

const COLORS = [
  'hsl(207, 90%, 54%)', // sky-500
  'hsl(160, 84%, 39%)', // emerald-500
  'hsl(43, 96%, 56%)',  // amber-500
  'hsl(0, 84%, 60%)',   // red-500
  'hsl(262, 83%, 58%)', // purple-500
  'hsl(142, 71%, 45%)', // green-500
];

export function MetricsChart({ 
  data, 
  type = 'line',
  height = 300,
  className,
  color = 'hsl(207, 90%, 54%)',
  showGrid = true,
  showTooltip = true
}: MetricsChartProps) {
  const numericData = data.map(item => ({
    ...item,
    value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-white text-sm">
              <span className="font-medium">{entry.name}:</span> {entry.value}
              {type === 'line' && entry.name === 'value' && 'ms'}
              {type === 'bar' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (numericData.length === 0) {
    return (
      <div 
        className={cn("flex items-center justify-center text-slate-400 bg-slate-750 rounded-lg border border-slate-600", className)}
        style={{ height }}
        data-testid="metrics-chart-empty"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={numericData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 27%)" />}
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={numericData}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              fill={color}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {numericData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={numericData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 27%)" />}
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'hsl(222, 84%, 4.9%)' }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={cn("w-full", className)} data-testid="metrics-chart">
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCurrency, Currency } from "@/hooks/useCurrency";
import { useMemo } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Distinct colors for macro categories
const COLORS = [
  "hsl(152, 69%, 31%)", // Green
  "hsl(199, 89%, 48%)", // Blue
  "hsl(262, 83%, 58%)", // Purple
  "hsl(38, 92%, 50%)",  // Orange
  "hsl(0, 84%, 60%)",   // Red
  "hsl(340, 75%, 54%)", // Pink
  "hsl(170, 75%, 41%)", // Teal
  "hsl(45, 90%, 55%)",  // Yellow
  "hsl(220, 70%, 50%)", // Indigo
  "hsl(10, 80%, 55%)",  // Burnt Orange
  "hsl(290, 70%, 50%)", // Violet
];



export function ExpenseChart({
  transactions,
  currency = "USD",
  exchangeRate = null
}: {
  transactions: Transaction[];
  currency?: Currency;
  exchangeRate?: number | null;
}) {
  const { convertValue, getCurrencySymbol } = useCurrency({ exchangeRate, currency });

  const chartData = useMemo(() => {
    // 1. Filter expenses
    const expenses = transactions.filter((t) => t.type === "expense");

    if (expenses.length === 0) return [];

    // 2. Aggregate by Macro Category
    const grouped = expenses.reduce((acc, curr) => {
      const macro = curr.macroCategory;
      const category = curr.category;
      const amount = curr.amount;

      if (!acc[macro]) {
        acc[macro] = { value: 0, details: {} };
      }

      acc[macro].value += amount;

      if (!acc[macro].details[category]) {
        acc[macro].details[category] = 0;
      }
      acc[macro].details[category] += amount;

      return acc;
    }, {} as Record<string, { value: number; details: Record<string, number> }>);

    // 3. Format for Recharts and apply currency conversion
    return Object.entries(grouped).map(([name, data], index) => ({
      name,
      value: convertValue(data.value),
      color: COLORS[index % COLORS.length],
      details: Object.entries(data.details).map(([catName, catValue]) => ({
        name: catName,
        value: convertValue(catValue),
      })).sort((a, b) => b.value - a.value),
    })).sort((a, b) => b.value - a.value);

  }, [transactions, convertValue]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#29488e] text-center">Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[410px] w-full flex flex-col items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const symbol = getCurrencySymbol();
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="font-bold border-b pb-1 mb-2 text-primary">
            {data.name}
            <span className="float-right ml-4">{symbol}{data.value.toFixed(2)}</span>
          </div>
          <div className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.details.map((detail: any, idx: number) => (
              <div key={idx} className="text-sm flex justify-between gap-4">
                <span className="text-muted-foreground">{detail.name}</span>
                <span className="font-medium">{symbol}{detail.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label to show percentage inside the slice, hide if it's too small
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // Hide labels for small percentages (5% or less)
    if (percent <= 0.05) {
      return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed()}%`}
      </text>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
        <CardTitle className="text-lg sm:text-2xl font-bold text-[#2d509e] flex-1">
          Gastos por Categoría
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors shrink-0 ml-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d509e]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[250px] p-3" side="left" align="start">
            <p className="text-sm font-medium text-[#2d509e]">Desglose de tus gastos según sus categorías. Aquellos gastos menores al 5% no se muestran.</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col items-center">
          <div className="h-[280px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />

                {/* Center label for total */}
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-xl font-bold lg:text-2xl"
                >
                  {getCurrencySymbol()}{total.toFixed(2)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-2 max-h-[100px] overflow-y-auto px-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <span style={{ width: 14, height: 14, background: entry.color, borderRadius: '50%', display: 'inline-block' }} />
                <span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
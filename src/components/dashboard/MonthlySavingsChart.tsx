import { SavingsGoalCard } from "@/components/dashboard/GoalCard";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

// More saturated color palette (except for savings goal)
const pastelColors = [
  '#26C6DA', // cyan
  '#FF6384', // pink
  '#9e8fd4ff', // yellow
  '#7C4DFF', // purple
  '#FF8A65', // orange
  '#536DFE', // blue
  '#43A047', // green
  '#FFB300', // amber
  '#D500F9', // magenta
  '#00B8D4', // teal
  '#FF1744', // red
  '#00E676', // light green
];

// Custom Legend with better spacing
function CustomLegend({ chartData }: { chartData: any[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 list-none p-0 mt-4">
      {chartData.map((entry, index) => (
        <li key={`${entry.name}-${index}`} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border border-gray-200"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">
            {entry.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/hooks/useTransactions";
import { useCurrency, Currency } from "@/hooks/useCurrency";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function MonthlySavingsChart({
  transactions,
  goals = [],
  currency = "USD",
  exchangeRate = null
}: {
  transactions: Transaction[];
  goals?: any[];
  currency?: Currency;
  exchangeRate?: number | null;
}) {
  const { convertValue, getCurrencySymbol } = useCurrency({ exchangeRate, currency });
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all_months");

  const data = useMemo(() => {
    // 1. Preparar datos de ahorros mensuales (siempre visibles)
    const grouped: Record<string, { name: string; fullDate: Date; value: number }> = {};

    (transactions || []).forEach((t) => {
      const dateObj = parseISO(t.date);
      const monthKey = format(dateObj, "MMM", { locale: es });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          name: monthKey,
          fullDate: dateObj,
          value: 0
        };
      }

      if (t.type === "income") {
        grouped[monthKey].value += t.amount;
      } else {
        grouped[monthKey].value -= t.amount;
      }
    });

    const monthlyData = Object.values(grouped)
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
      .map((item, index) => ({
        name: item.name,
        value: Number(convertValue(item.value).toFixed(2)),
        isGoal: false,
        color: pastelColors[index % pastelColors.length]
      }));

    // 2. Incorporar solo la meta seleccionada (si existe)
    let goalsData: any[] = [];
    if (selectedGoalId !== "all_months") {
      const selectedGoal = goals.find(g => g.id === selectedGoalId);
      if (selectedGoal) {
        const current = Number(selectedGoal.current_amount || 0);
        const target = Number(selectedGoal.target_amount || 0);
        goalsData = [{
          name: `Meta: ${selectedGoal.title}`,
          value: Number(convertValue(current).toFixed(2)),
          target: Number(convertValue(target).toFixed(2)),
          isGoal: true,
          color: '#94a3b8'
        }];
      }
    }

    return [...goalsData, ...monthlyData];
  }, [transactions, goals, selectedGoalId, convertValue]);

  const { minVal, maxVal } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 100 };

    const values = data.map(d => {
      const v = Number(d.value) || 0;
      const t = Number((d as any).target) || 0;
      return [v, t];
    }).flat();

    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100);

    return {
      minVal: isNaN(min) ? 0 : min,
      maxVal: isNaN(max) ? 100 : max
    };
  }, [data]);

  return (
    <Card className="border-2 shadow-sm relative">
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <CardTitle className="text-lg sm:text-2xl font-bold text-primary flex-1">
            Ahorros mensuales
          </CardTitle>
          {goals && goals.length > 0 && (
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger className="w-[180px] h-8 text-xs border-slate-200">
                <SelectValue placeholder="Seleccionar meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_months">Solo ahorros</SelectItem>
                {goals.map(goal => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors shrink-0 ml-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[250px] p-3" side="left" align="start">
            <p className="text-sm font-medium text-primary">Comparativa de tus ahorros mensuales. Puedes ajustar tu meta en la sección de metas.</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[450px] w-full pt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
              barGap={10}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(var(--border))"
                className="stroke-border/50"
              />
              <XAxis
                type="number"
                orientation="top"
                domain={[minVal * 1.2, maxVal * 1.2]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'currentColor', fontSize: 10 }}
                className="fill-muted-foreground text-muted-foreground"
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={-10}
                      y={0}
                      dy={4}
                      textAnchor="end"
                      fill="hsl(var(--foreground))"
                      className="fill-muted-foreground text-muted-foreground font-semibold"
                      fontSize={11}
                    >
                      {payload.value.length > 20 ? `${payload.value.substring(0, 17)}...` : payload.value}
                    </text>
                  </g>
                )}
                width={130}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  padding: "12px"
                }}
                formatter={(value: number, name: string, props: any) => {
                  const entry = props.payload;
                  if (entry.isGoal) {
                    return [`${getCurrencySymbol()}${value} / ${getCurrencySymbol()}${entry.target}`, "Progreso"];
                  }
                  return [`${getCurrencySymbol()}${value}`, "Ahorro"];
                }}
              />
              <Legend verticalAlign="bottom" height={50} content={<CustomLegend chartData={data} />} />

              <Bar
                dataKey="value"
                name="Monto"
                radius={[0, 10, 10, 0]}
                barSize={30}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={entry.isGoal ? '#94a3b8' : entry.color}
                    fillOpacity={entry.isGoal ? 0.4 : 0.9}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  content={(props: any) => {
                    const { x, y, width, value, offset } = props;
                    const isNegative = value < 0;
                    const labelX = isNegative ? x - 45 : x + width + 5;
                    return (
                      <text
                        x={labelX}
                        y={y + 20}
                        fill="currentColor"
                        className="fill-foreground font-bold"
                        fontSize={11}
                        textAnchor={isNegative ? "end" : "start"}
                      >
                        {`${getCurrencySymbol()}${value.toLocaleString()}`}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SavingsGoalCard } from "./GoalCard";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Transaction } from "@/hooks/useTransactions";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const grouped: Record<string, { date: string; fullDate: Date; ingresos: number; gastos: number }> = {};

    transactions.forEach((t) => {
      const dateObj = parseISO(t.date);
      const monthKey = format(dateObj, "MMM", { locale: es });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          date: monthKey,
          fullDate: dateObj,
          ingresos: 0,
          gastos: 0
        };
      }

      if (t.type === "income") {
        grouped[monthKey].ingresos += t.amount;
      } else {
        grouped[monthKey].gastos += t.amount;
      }
    });

    return Object.values(grouped).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [transactions]);

  const averageExpenses = useMemo(() => {
    if (chartData.length === 0) return 0;
    const totalGastos = chartData.reduce((acc, current) => acc + current.gastos, 0);
    return totalGastos / chartData.length;
  }, [chartData]);

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
        <div className="flex-1 text-center">
          <CardTitle className="text-2xl font-bold text-[#2d509e] mr-[-40px]">
            Gastos V.S Ingresos
          </CardTitle>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors">
              <Info className="w-6 h-6 text-[#2d509e]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <p className="text-sm font-medium text-[#2d509e]">Comparativa de ingresos y gastos mensuales</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#ececec" strokeDasharray="6 6" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend
                iconType="circle"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 12, bottom: 0 }}
                payload={[
                  { value: 'Gastos', type: 'circle', color: '#6C7AF2' },
                  { value: 'Ingresos', type: 'circle', color: '#FF8A8A' },
                ]}
              />
              <Area
                type="monotone"
                dataKey="gastos"
                name="Gastos"
                stroke="#6C7AF2"
                fill="#6C7AF2"
                fillOpacity={0.15}
                strokeWidth={3}
                dot={{ stroke: '#6C7AF2', strokeWidth: 2, fill: '#fff', r: 6 }}
                activeDot={{ stroke: '#6C7AF2', strokeWidth: 3, fill: '#fff', r: 8 }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#FF8A8A"
                fill="#FF8A8A"
                fillOpacity={0.15}
                strokeWidth={3}
                dot={{ stroke: '#FF8A8A', strokeWidth: 2, fill: '#fff', r: 6 }}
                activeDot={{ stroke: '#FF8A8A', strokeWidth: 3, fill: '#fff', r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <div className="px-6 pb-6">
        <SavingsGoalCard goal={averageExpenses} text="Promedio de gasto diario:" currency="$" />
      </div>
    </Card>
  );
}

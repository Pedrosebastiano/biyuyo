
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Dot } from "recharts";
import { SavingsGoalCard } from "./GoalCard";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const data = [
  { date: "02-28", gastos: 16, ingresos: 40 },
  { date: "03-01", gastos: 14, ingresos: 48 },
  { date: "03-02", gastos: 12, ingresos: 42 },
  { date: "03-03", gastos: 10, ingresos: 50 },
  { date: "03-04", gastos: 13, ingresos: 46 },
  { date: "03-05", gastos: 15, ingresos: 44 },
  { date: "03-06", gastos: 14, ingresos: 52 },
];

export function IncomeExpenseChart() {
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
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#ececec" strokeDasharray="6 6" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`$${value}`, '']}
                contentStyle={{ backgroundColor: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10 }}
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
        <SavingsGoalCard goal={100} text="Promedio de gasto diario:" currency="$" />
      </div>
    </Card>
  );
}

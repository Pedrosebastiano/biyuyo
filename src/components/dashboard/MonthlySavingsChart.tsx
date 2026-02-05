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
  Cell
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

// Custom Legend to show all bars
function CustomLegend({ chartData }: { chartData: any[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
      {chartData.map((entry) => (
        <li key={entry.name} style={{ display: 'flex', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
          <span style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            backgroundColor: entry.color,
            marginRight: 6,
            borderRadius: 4,
            border: '1px solid #ccc',
          }} />
          <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}</span>
        </li>
      ))}
    </ul>
  );
}

import { Transaction } from "@/hooks/useTransactions";
import { useCurrency, Currency } from "@/hooks/useCurrency";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function MonthlySavingsChart({
  transactions,
  currency = "USD",
  exchangeRate = null
}: {
  transactions: Transaction[];
  currency?: Currency;
  exchangeRate?: number | null;
}) {
  const { convertValue, getCurrencySymbol } = useCurrency({ exchangeRate, currency });
  const [savingsGoal, setSavingsGoal] = useState(100);
  const [tempGoal, setTempGoal] = useState(savingsGoal.toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const data = useMemo(() => {
    const baseData = [{ name: "Meta de ahorro", value: convertValue(savingsGoal), color: "#bdbdbd" }];
    if (!transactions || transactions.length === 0) return baseData;

    const grouped: Record<string, { name: string; fullDate: Date; value: number }> = {};

    transactions.forEach((t) => {
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
        color: pastelColors[index % pastelColors.length]
      }));

    return [...baseData, ...monthlyData];
  }, [transactions, savingsGoal, convertValue]);

  const handleSaveGoal = () => {
    const newGoal = parseFloat(tempGoal);
    if (!isNaN(newGoal) && newGoal >= 0) {
      setSavingsGoal(newGoal);
      setIsDialogOpen(false);
    }
  };

  return (
    <Card className="border-2 shadow-sm relative">
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
        <CardTitle className="text-lg sm:text-2xl font-bold text-[#2d509e] flex-1">
            Ahorros mensuales
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors shrink-0 ml-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d509e]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[250px] p-3" side="left" align="start">
            <p className="text-sm font-medium text-[#2d509e]">Comparativa de tus ahorros mensuales. Puedes ajustar tu meta en la sección de metas.</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={45}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e0e0e0"
              />
              <XAxis
                type="number"
                orientation="top"
                domain={[0, Math.max(100, savingsGoal + 20)]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                hide
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${getCurrencySymbol()}${value}`, "Ahorro"]}
              />
              <Legend verticalAlign="bottom" height={36} content={<CustomLegend chartData={data} />} />

              <Bar
                dataKey="value"
                name="Ahorro"
                radius={[0, 25, 25, 0]}
                legendType="rect"
                label={({ x, y, width, height, value, index }) => {
                  const entry = data[index];
                  return (
                    <g>
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={entry.color}
                        fontSize={14}
                        fontWeight="bold"
                      >
                        {`${entry.name}: ${getCurrencySymbol()}${value}`}
                      </text>
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`bar-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <div className="px-8 pb-6 flex flex-col gap-4">
        <SavingsGoalCard
          goal={convertValue(savingsGoal)}
          text="Meta de ahorro:"
          currency={getCurrencySymbol()}
          style={{ margin: 0 }}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-[#29488e] hover:bg-[#1e356d] text-white font-bold py-6 rounded-xl text-lg shadow-md"
              onClick={() => setTempGoal(savingsGoal.toString())}
            >
              Cambiar meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-[#2d509e] text-2xl">Cambiar meta de ahorro</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="savings-goal" className="text-[#2d509e] font-semibold">
                  Nueva meta ($)
                </Label>
                <Input
                  id="savings-goal"
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  placeholder="Ej: 200"
                  className="rounded-lg border-[#2d509e]/20 focus-visible:ring-[#2d509e]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSaveGoal}
                className="bg-[#29488e] hover:bg-[#1e356d] text-white font-bold px-8"
              >
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

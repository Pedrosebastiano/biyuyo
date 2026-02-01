import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Housing", value: 1200, color: "hsl(152, 69%, 31%)" },
  { name: "Food", value: 450, color: "hsl(199, 89%, 48%)" },
  { name: "Transport", value: 280, color: "hsl(262, 83%, 58%)" },
  { name: "Entertainment", value: 180, color: "hsl(38, 92%, 50%)" },
  { name: "Utilities", value: 150, color: "hsl(0, 84%, 60%)" },
];

export function ExpenseChart() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value}`, "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

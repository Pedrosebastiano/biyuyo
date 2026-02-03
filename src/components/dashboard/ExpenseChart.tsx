
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Tooltip } from "recharts";

const data = [
  { name: "Fijos", value: 361.36, color: "#8C8CFF" },
  { name: "Variables", value: 182.93, color: "#FF8A8A" },
  { name: "Ahorros", value: 162.48, color: "#4DD0E1" },
];

const total = data.reduce((sum, d) => sum + d.value, 0);

export function ExpenseChart() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#29488e] text-center">Gastos V.S Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[410px] w-full flex flex-col items-center justify-center">
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={155}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  labelLine={false}
                  label={({ cx, cy, midAngle, outerRadius, percent, index, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (outerRadius + 85) / 2;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <g>
                        <text
                          x={x}
                          y={y - 8}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight={600}
                        >
                          {`$${value.toFixed(2)}`}
                        </text>
                        <text
                          x={x}
                          y={y + 10}
                          fill="white"
                          textAnchor="middle"
                          fontSize={12}
                        >
                          {`${(percent * 100).toFixed(2)}%`}
                        </text>
                      </g>
                    );
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    const percent = ((value / total) * 100).toFixed(2);
                    return [`$${value.toFixed(2)} (${percent}%)`, name];
                  }}
                  contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #eee', fontWeight: 500, fontSize: 14 }}
                />
                {/* Center label for total */}
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={24}
                  fontWeight={700}
                  fill="#222E50"
                >
                  ${total.toFixed(2)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span style={{ width: 14, height: 14, background: '#8C8CFF', borderRadius: '50%', display: 'inline-block' }} />
              <span className="text-[#8C8CFF] font-medium">Fijos</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 14, height: 14, background: '#FF8A8A', borderRadius: '50%', display: 'inline-block' }} />
              <span className="text-[#FF8A8A] font-medium">Variables</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 14, height: 14, background: '#4DD0E1', borderRadius: '50%', display: 'inline-block' }} />
              <span className="text-[#4DD0E1] font-medium">Ahorros</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const debtItems = [
    { name: "Mensualidad del gimnasio", amount: 80 },
    { name: "Cashea", amount: 100 },
];

const totalMoney = 1200;
const debtAmount = debtItems.reduce((acc, item) => acc + item.amount, 0) || 1;
const percentage = (debtAmount / totalMoney) * 100;

const getColor = (percent: number) => {
    if (percent <= 20) return "#00E676"; // Green (Healthy)
    if (percent <= 35) return "#FFD600"; // Yellow (Precaution)
    return "#FF1744"; // Red (Critical)
};

const fillColor = getColor(percentage);

const data = [
    {
        name: "Deudas",
        value: percentage,
        fill: fillColor,
    },
];

interface DebtListCardProps {
    items: { name: string; amount: number }[];
}

const DebtListCard: React.FC<DebtListCardProps> = ({ items }) => {
    return (
        <div
            style={{
                background: "#D1FDFC", // Light cyan from reference image
                borderRadius: 12,
                padding: "1.5rem",
                marginTop: "1rem",
                color: "#2d509e"
            }}
        >
            <h3 className="text-xl font-bold mb-4 italic text-[#4DD0E1]">Deudas pendientes</h3>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#D1FDFC]">
                            <th className="px-4 py-3 text-[#29488e] font-bold text-sm uppercase tracking-wider">Deuda</th>
                            <th className="px-4 py-3 text-[#29488e] font-bold text-sm uppercase tracking-wider text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className={index !== items.length - 1 ? "border-b border-[#f0f9f9]" : ""}>
                                <td className="px-4 py-3 text-[#29488e] font-medium">{item.name}</td>
                                <td className="px-4 py-3 text-[#29488e] font-bold text-right">${item.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export function DebtRatio() {
    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
                <div className="flex-1 text-center">
                    <CardTitle className="text-2xl font-bold text-[#2d509e] mr-[-40px]">
                        Compromiso financiero
                    </CardTitle>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors">
                            <Info className="w-6 h-6 text-[#2d509e]" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                        <p className="text-sm font-medium text-[#2d509e]">Deudas sobre ingresos</p>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="h-[260px] w-full relative -mt-4">
                    <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-medium">
                        {`${percentage.toFixed(0)}%`}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="80%"
                            innerRadius={120}
                            outerRadius={280}
                            barSize={80}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background={{ fill: '#D1FDFC' }}
                                dataKey="value"
                                cornerRadius={5}
                            />

                            <Legend
                                iconSize={10}
                                layout="horizontal"
                                verticalAlign="bottom"
                                wrapperStyle={{ bottom: '10px' }}
                                align="center"
                                content={() => (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: fillColor }}></span>
                                        <span className="text-gray-600 font-medium">Deudas</span>
                                    </div>
                                )}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Centered Total Amount */}
                    <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-4xl font-bold text-[#1a1a1a]">${debtAmount}</span>
                    </div>
                </div>

                <DebtListCard items={debtItems} />
            </CardContent>
        </Card>
    );
}

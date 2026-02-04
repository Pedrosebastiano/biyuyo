import React, { useState, useMemo } from "react";
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
} from "recharts";
import { SavingsGoalCard } from "@/components/dashboard/GoalCard";
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

interface MonthsGoalCardProps {
    months: number;
}

const MonthsGoalCard: React.FC<MonthsGoalCardProps> = ({ months }) => {
    return (
        <div
            style={{
                background: "#C5D3F7",
                borderRadius: 12,
                padding: "0.75rem 1.5rem",
                display: "inline-flex",
                alignItems: "center",
                color: "#29488e",
                fontWeight: 500,
                fontSize: 18,
                marginTop: "1rem",
                marginBottom: "1rem"
            }}
        >
            <span className="mr-3">Meses meta:</span>
            <div
                style={{
                    background: "white",
                    borderRadius: 8,
                    padding: "2px 12px",
                    fontWeight: 700,
                    color: "#29488e"
                }}
            >
                {months}
            </div>
        </div>
    );
};

// Custom shape to simulate cylinder top
const CylinderBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    if (height === 0) return null;
    return (
        <g>
            <path d={`M${x},${y + height} v-${height} a${width / 2},${width / 6} 0 0,1 ${width},0 v${height} z`} fill={fill} />
            <ellipse cx={x + width / 2} cy={y} rx={width / 2} ry={width / 6} fill="#B4B3FF" />
        </g>
    );
};

export function EmergencyFund() {
    // Variable definition for core numbers
    const totalSavings = 1200;
    const monthlyExpenses = 400;

    const [goalMonths, setGoalMonths] = useState(6);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempGoalMonths, setTempGoalMonths] = useState(goalMonths.toString());

    // Calculations based on user logic:
    // Months of Freedom = Total Savings / Monthly Expenses
    const estimatedMonthsOfFreedom = totalSavings / monthlyExpenses;

    // Meta bar = Goal Months * Monthly Expenses
    const targetMetaAmount = goalMonths * monthlyExpenses;

    const data = useMemo(() => [
        { name: "Fondo actual", value: totalSavings, color: "#9594FF" },
        { name: "Fondos requeridos", value: targetMetaAmount, color: "#9594FF" },
    ], [totalSavings, targetMetaAmount]);

    const handleSaveGoal = () => {
        const newGoal = parseInt(tempGoalMonths);
        if (!isNaN(newGoal) && newGoal > 0) {
            setGoalMonths(newGoal);
            setIsDialogOpen(false);
        }
    };

    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-0 pt-6 px-6">
                <div className="flex-1 text-center">
                    <CardTitle className="text-2xl font-bold text-[#2d509e] mr-[-40px]">
                        Fondo actual V.S Meta
                    </CardTitle>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-gray-50 hover:bg-gray-50 transition-colors">
                            <Info className="w-6 h-6 text-[#2d509e]" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                        <p className="text-sm font-medium text-[#2d509e]">Fondo de emergencia y meses de libertad</p>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-start px-6">
                    <SavingsGoalCard
                        goal={estimatedMonthsOfFreedom}
                        text="Meses de libertad estimados:"
                        currency=""
                        style={{ margin: "1rem 0" }}
                    />
                    <MonthsGoalCard months={goalMonths} />
                </div>

                <div className="h-[300px] w-full mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barSize={80}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e0e0e0"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={true}
                                tickLine={false}
                                tick={{ fill: '#444', fontSize: 13 }}
                                stroke="#888"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#666', fontSize: 12 }}
                                domain={[0, Math.max(targetMetaAmount, totalSavings) + 200]}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                }}
                                formatter={(value: number) => [`$${value}`, "Ahorros"]}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="square"
                                formatter={() => <span style={{ color: '#444' }}>Ahorros</span>}
                            />

                            <Bar
                                dataKey="value"
                                fill="#9594FF"
                                shape={<CylinderBar />}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="px-6 pb-4 mt-6 flex flex-col gap-4">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full bg-[#29488e] hover:bg-[#1e356d] text-white font-bold py-6 rounded-xl text-lg shadow-md"
                                onClick={() => setTempGoalMonths(goalMonths.toString())}
                            >
                                Cambiar meta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-[#2d509e] text-2xl">Cambiar meses meta</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fund-goal" className="text-[#2d509e] font-semibold">
                                        Nuevos meses meta
                                    </Label>
                                    <Input
                                        id="fund-goal"
                                        type="number"
                                        value={tempGoalMonths}
                                        onChange={(e) => setTempGoalMonths(e.target.value)}
                                        placeholder="Ej: 6"
                                        className="rounded-lg border-[#2d509e]/20 focus-visible:ring-[#2d509e]"
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    La meta en dinero se actualizará automáticamente multiplicando los meses por tus gastos mensuales.
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
            </CardContent>
        </Card>
    );
}

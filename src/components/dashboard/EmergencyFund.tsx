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
        <div className="bg-[#C5D3F7] dark:bg-primary/10 rounded-xl px-6 py-3 inline-flex items-center text-[#29488e] dark:text-primary font-medium text-lg mt-4 mb-4">
            <span className="mr-3">Meses meta:</span>
            <div className="bg-white dark:bg-background rounded-lg px-3 py-0.5 font-bold text-[#29488e] dark:text-primary border border-[#A5B3D7] dark:border-primary/20">
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

import { Account, Transaction } from "@/hooks/useTransactions";
import { useCurrency, Currency } from "@/hooks/useCurrency";

export function EmergencyFund({
    accounts,
    transactions,
    currency = "USD",
    exchangeRate = null
}: {
    accounts: Account[];
    transactions: Transaction[];
    currency?: Currency;
    exchangeRate?: number | null;
}) {
    const { convertValue, getCurrencySymbol } = useCurrency({ exchangeRate, currency });
    const [goalMonths, setGoalMonths] = useState(6);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempGoalMonths, setTempGoalMonths] = useState(goalMonths.toString());

    // Variable definition for core numbers derived from props
    const totalSavings = useMemo(() =>
        accounts.reduce((acc, curr) => acc + curr.savings, 0),
        [accounts]);

    const monthlyExpenses = useMemo(() => {
        const expenses = transactions.filter(t => t.type === "expense");
        if (expenses.length === 0) return 0; // No hardcoded fallback

        const grouped: Record<string, number> = {};
        expenses.forEach(e => {
            const month = e.date.substring(0, 7); // YYYY-MM
            grouped[month] = (grouped[month] || 0) + e.amount;
        });

        const values = Object.values(grouped);
        return values.reduce((a, b) => a + b, 0) / (values.length || 1);
    }, [transactions]);

    // Calculations based on user logic:
    const estimatedMonthsOfFreedom = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
    const targetMetaAmount = goalMonths * monthlyExpenses;

    const data = useMemo(() => [
        { name: "Fondo actual", value: Number(convertValue(totalSavings).toFixed(2)), color: "#9594FF" },
        { name: "Fondos requeridos", value: Number(convertValue(targetMetaAmount).toFixed(2)), color: "#9594FF" },
    ], [totalSavings, targetMetaAmount, convertValue]);

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
                <CardTitle className="text-lg sm:text-2xl font-bold text-primary flex-1">
                    Fondo actual V.S Meta
                </CardTitle>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-border hover:bg-accent transition-colors shrink-0 ml-2">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto max-w-[250px] p-3" side="left" align="start">
                        <p className="text-sm font-medium text-primary">Fondo de emergencia y meses de libertad</p>
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
                                stroke="hsl(var(--border))"
                                className="stroke-border/50"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={true}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 13 }}
                                stroke="hsl(var(--border))"
                                className="fill-muted-foreground text-muted-foreground"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                className="fill-muted-foreground text-muted-foreground"
                                domain={[0, Math.max(targetMetaAmount, totalSavings) * 1.2]}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "2px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                formatter={(value: number) => [`${getCurrencySymbol()}${value}`, "Ahorros"]}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="square"
                                formatter={() => <span className="text-muted-foreground">Ahorros</span>}
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
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl text-lg shadow-md"
                                onClick={() => setTempGoalMonths(goalMonths.toString())}
                            >
                                Cambiar meta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-primary text-2xl">Cambiar meses meta</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fund-goal" className="text-primary font-semibold">
                                        Nuevos meses meta
                                    </Label>
                                    <Input
                                        id="fund-goal"
                                        type="number"
                                        value={tempGoalMonths}
                                        onChange={(e) => setTempGoalMonths(e.target.value)}
                                        placeholder="Ej: 6"
                                        className="rounded-lg border-primary/20 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    La meta en dinero se actualizará automáticamente multiplicando los meses por tus gastos mensuales.
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleSaveGoal}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from "recharts";
import { useCurrency, Currency } from "@/hooks/useCurrency";
import { Target, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const goalColors = [
    '#2d509e', // Primary blue
    '#4f46e5', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
];

export function GoalsProgressChart({
    goals,
    currency = "USD",
    exchangeRate = null
}: {
    goals: any[];
    currency?: Currency;
    exchangeRate?: number | null;
}) {
    const { convertValue, getCurrencySymbol } = useCurrency({ exchangeRate, currency });

    const data = (goals || []).map((goal, index) => {
        const current = Number(goal?.current_amount) || 0;
        const target = Number(goal?.target_amount) || 1; // Evitar división por cero
        const progress = Math.min((current / target) * 100, 100);

        return {
            name: goal?.title || "Meta sin título",
            current: Number(convertValue(current).toFixed(2)),
            target: Number(convertValue(target).toFixed(2)),
            progress: Math.round(progress) || 0,
            color: goalColors[index % goalColors.length]
        };
    });

    if (!goals || goals.length === 0) {
        return (
            <Card className="border-2 shadow-sm h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                <Target className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No hay metas activas</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Crea metas de ahorro para ver tu progreso reflejado aquí.
                </p>
            </Card>
        );
    }

    return (
        <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
                <CardTitle className="text-xl font-bold text-primary">
                    Progreso de Metas
                </CardTitle>
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Info className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto max-w-[250px] p-3" side="left">
                        <p className="text-sm font-medium">Compara cuánto has ahorrado frente al objetivo final de cada meta.</p>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" className="stroke-border/50" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }}
                                className="fill-muted-foreground text-muted-foreground"
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(45, 80, 158, 0.05)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number, name: string) => [
                                    `${getCurrencySymbol()}${value.toLocaleString()}`,
                                    name === "current" ? "Ahorrado" : "Objetivo"
                                ]}
                            />

                            {/* Background bar (Target) */}
                            <Bar
                                dataKey="target"
                                fill="currentColor"
                                className="text-muted/30"
                                radius={12}
                                background={{ fill: 'currentColor', radius: 12, className: "text-muted/10" }}
                                isAnimationActive={false}
                            />

                            {/* Foreground bar (Current) */}
                            <Bar
                                dataKey="current"
                                radius={12}
                                label={{
                                    position: 'right',
                                    formatter: (val: any, entry: any) => {
                                        if (entry && entry.payload) {
                                            return `${entry.payload.progress}%`;
                                        }
                                        return `${val}%`;
                                    },
                                    fill: 'currentColor',
                                    className: "fill-foreground font-bold",
                                    fontSize: 12,
                                }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

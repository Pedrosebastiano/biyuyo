import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getMLApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { AlertCircle, BrainCircuit, CheckCircle2, Info, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { macroCategories } from "@/data/categories";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ImpactAnalysis {
    monto_planeado: number;
    saldo_proyectado: number;
    riesgo_negativo_score: number;
    mensaje: string;
}

interface PredictionData {
    prediccion_gasto: number;
    trust_score: number;
    impact_analysis: ImpactAnalysis | null;
    behavioral_insight: string;
}

const ML = () => {
    const { user } = useAuth();
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<PredictionData | null>(null);

    // Form State
    const [macroCategory, setMacroCategory] = useState("");
    const [plannedAmount, setPlannedAmount] = useState("");

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.user_id || !macroCategory) {
            toast.warning("Campos incompletos", {
                description: "Por favor selecciona una categoría para obtener una predicción."
            });
            return;
        }

        setIsPredicting(true);
        try {
            const response = await fetch(`${getMLApiUrl()}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.user_id,
                    macrocategoria: macroCategory,
                    monto_planeado: plannedAmount ? parseFloat(plannedAmount) : null,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setPrediction(data);
                toast.success("Predicción generada");
            } else {
                toast.error("Error en la predicción", {
                    description: data.detail || "Asegúrate de haber entrenado tu modelo primero."
                });
            }
        } catch (error) {
            toast.error("Error de conexión", {
                description: "No se pudo conectar con el servidor de IA."
            });
        } finally {
            setIsPredicting(false);
        }
    };

    const getTrustColor = (score: number) => {
        if (score > 80) return "text-green-600 bg-green-50 border-green-200";
        if (score > 50) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#2d509e] flex items-center gap-2">
                            <BrainCircuit className="h-8 w-8" />
                            IA Predictor
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Análisis financiero avanzado impulsado por inteligencia artificial.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prediction Form */}
                    <Card className="lg:col-span-2 border-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-[#2d509e] text-xl flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Simulador de Gastos
                            </CardTitle>
                            <CardDescription>
                                Proyecta tus gastos y analiza el impacto de futuras compras en tu salud financiera.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePredict} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Macro Categoría</Label>
                                        <Select onValueChange={setMacroCategory} value={macroCategory}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Selecciona categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {macroCategories.map((macro) => (
                                                    <SelectItem key={macro.id} value={macro.name}>
                                                        {macro.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plannedAmount">Monto de Compra (Opcional)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                            <Input
                                                id="plannedAmount"
                                                type="number"
                                                placeholder="Ej: 500 para analizar impacto"
                                                className="pl-7"
                                                value={plannedAmount}
                                                onChange={(e) => setPlannedAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isPredicting}
                                    className="w-full bg-[#29488e] hover:bg-[#1e356d] text-white font-bold h-12"
                                >
                                    {isPredicting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analizando datos...
                                        </>
                                    ) : (
                                        "Generar Análisis de IA"
                                    )}
                                </Button>
                            </form>

                            {prediction && (
                                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Result Card */}
                                        <div className="p-4 rounded-xl border border-[#c5d3f7] bg-[#f0f4ff]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[#29488e] text-sm font-medium">Gasto Estimado</span>
                                                <Badge variant="outline" className={cn("font-bold", getTrustColor(prediction.trust_score))}>
                                                    {prediction.trust_score}% Confianza
                                                </Badge>
                                            </div>
                                            <div className="text-3xl font-bold text-[#29488e] mb-2">
                                                ${prediction.prediccion_gasto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <Progress value={prediction.trust_score} className="h-1.5" />
                                        </div>

                                        {/* Temporal Card */}
                                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-1">
                                                <Zap className="h-4 w-4" />
                                                Insight de Comportamiento
                                            </div>
                                            <p className="text-sm text-indigo-900 leading-tight">
                                                {prediction.behavioral_insight}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Impact Analysis */}
                                    {prediction.impact_analysis && (
                                        <div className={cn(
                                            "p-5 rounded-xl border flex gap-4 items-start",
                                            prediction.impact_analysis.riesgo_negativo_score >= 75
                                                ? "bg-red-50 border-red-200 text-red-900"
                                                : prediction.impact_analysis.riesgo_negativo_score >= 30
                                                    ? "bg-amber-50 border-amber-200 text-amber-900"
                                                    : "bg-green-50 border-green-200 text-green-900"
                                        )}>
                                            <div className="mt-0.5">
                                                {prediction.impact_analysis.riesgo_negativo_score >= 75
                                                    ? <AlertCircle className="h-6 w-6 text-red-600" />
                                                    : <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                }
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg leading-tight mb-1">Análisis de la Compra</div>
                                                <p className="text-sm opacity-90 mb-2">
                                                    {prediction.impact_analysis.mensaje}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                                                    <div>
                                                        Saldo Proyectado:
                                                        <span className="ml-1 text-base block normal-case font-black">
                                                            ${prediction.impact_analysis.saldo_proyectado.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Riesgo de impacto:
                                                        <span className="ml-1 text-base block normal-case font-black">
                                                            {prediction.impact_analysis.riesgo_negativo_score}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <div className="space-y-6">
                        <Card className="bg-[#2d509e] text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    ¿Cómo funciona?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-white/90 text-sm">
                                <p>
                                    Nuestra IA analiza tus últimos meses de transacciones para entender tus <strong>patrones naturales de consumo</strong>.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
                                        <span>Calcula el gasto promedio según tus ingresos.</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</div>
                                        <span>Detecta sesgos temporales (ej: gastos de fin de semana).</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</div>
                                        <span>Proyecta tu flujo de caja para alertas de riesgo.</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Consejo Pro
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Mientras más transacciones registres, mayor será el **score de confianza** de las predicciones. Intenta mantener tus registros al día.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ML;

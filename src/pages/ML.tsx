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
import { BrainCircuit, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { macroCategories } from "@/data/categories";

const ML = () => {
    const { user } = useAuth();
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<number | null>(null);

    // Form State
    const [macroCategory, setMacroCategory] = useState("");
    const [income, setIncome] = useState("");
    const [savings, setSavings] = useState("");

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.user_id || !macroCategory || !income || !savings) {
            toast.warning("Campos incompletos", {
                description: "Por favor llena todos los campos para obtener una predicción."
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
                    ingreso_mensual: parseFloat(income),
                    ahorro_actual: parseFloat(savings),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setPrediction(data.prediccion_gasto);
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

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#2d509e] flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8" />
                        IA Predictor
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Utiliza inteligencia artificial para predecir tus gastos futuros basados en tus hábitos reales.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Prediction Form */}
                    <Card className="border-2 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-[#2d509e] text-xl flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Simulador de Gastos
                            </CardTitle>
                            <CardDescription>
                                Descubre cuánto podrías gastar en una categoría específica según tu situación actual. El modelo se actualiza automáticamente con cada transacción.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePredict} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Macro Categoría</Label>
                                        <Select onValueChange={setMacroCategory} value={macroCategory}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Selecciona macro-categoría" />
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
                                        <Label htmlFor="income">Ingreso Mensual ($)</Label>
                                        <Input
                                            id="income"
                                            type="number"
                                            placeholder="Ej: 2500"
                                            value={income}
                                            onChange={(e) => setIncome(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="savings">Ahorro Actual ($)</Label>
                                        <Input
                                            id="savings"
                                            type="number"
                                            placeholder="Ej: 5000"
                                            value={savings}
                                            onChange={(e) => setSavings(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t">
                                    <Button
                                        type="submit"
                                        disabled={isPredicting}
                                        className="w-full sm:w-auto bg-[#29488e] hover:bg-[#1e356d] text-white font-bold px-8 h-12"
                                    >
                                        {isPredicting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Calculando...
                                            </>
                                        ) : (
                                            "Generar Predicción"
                                        )}
                                    </Button>

                                    {prediction !== null && (
                                        <div className="flex-1 w-full bg-[#f0f4ff] p-4 rounded-xl border border-[#c5d3f7] flex items-center justify-between">
                                            <span className="text-[#29488e] font-medium">Gasto estimado:</span>
                                            <span className="text-2xl font-bold text-[#29488e]">
                                                ${prediction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ML;

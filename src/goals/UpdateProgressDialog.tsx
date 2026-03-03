import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, DollarSign } from "lucide-react";

interface UpdateProgressDialogProps {
    goal: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (id: string, newAmount: number) => void;
}

export function UpdateProgressDialog({ goal, open, onOpenChange, onUpdate }: UpdateProgressDialogProps) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setAmount("");
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal) return;

        const val = parseFloat(amount);
        if (isNaN(val)) return;

        setLoading(true);
        // the value is added to current_amount as per original logic
        const newTotal = Number(goal.current_amount) + val;
        await onUpdate(goal.id, newTotal);
        setLoading(false);
        onOpenChange(false);
    };

    if (!goal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl gap-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#2d509e] flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Actualizar Progreso
                    </DialogTitle>
                    <DialogDescription>
                        ¿Cuánto dinero quieres abonar a tu meta: <strong>{goal.title}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Progreso actual:</span>
                            <span className="font-bold text-primary">${Number(goal.current_amount).toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="add_amount">Monto a agregar</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="add_amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-9 rounded-xl h-12 text-lg font-semibold"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                        >
                            {loading ? "Actualizando..." : "Confirmar Abono"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

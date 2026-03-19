import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { useTransactionRefresh } from "@/contexts/TransactionRefreshContext";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { PiggyBank, Loader2 } from "lucide-react";

interface RegisterSavingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RegisterSavingsDialog({ open, onOpenChange }: RegisterSavingsDialogProps) {
    const { user } = useAuth();
    const { activeSharedProfile } = useSharedProfile();
    const { triggerRefresh } = useTransactionRefresh();
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Por favor ingresa un monto válido mayor a 0");
            return;
        }

        setIsSubmitting(true);
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/accounts/savings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.user_id,
                    sharedId: activeSharedProfile?.shared_id || null,
                    amount: numAmount,
                }),
            });

            if (response.ok) {
                toast.success("Ahorro registrado exitosamente");
                triggerRefresh(); // Actualiza el contexto y el Dashboard/Emergency Fund
                setAmount("");
                onOpenChange(false);
            } else {
                toast.error("Error al registrar ahorro");
            }
        } catch (error) {
            console.error("Error saving global savings:", error);
            toast.error("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                <DialogHeader className="flex flex-col items-center pt-8 pb-4">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <PiggyBank className="w-12 h-12 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">Registrar Ahorro General</DialogTitle>
                    <DialogDescription className="text-center">
                        Ingresa dinero directamente a tu fondo de ahorro actual. Esto también aumentará tu balance disponible.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 px-4 py-2">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="savings-amount" className="text-sm font-semibold text-muted-foreground">
                            Monto a ahorrar
                        </Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">
                                $
                            </span>
                            <Input
                                id="savings-amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-8 h-12 text-lg rounded-xl border-2"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-4 pb-8 pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || isSubmitting}
                        className="w-full h-12 rounded-xl text-md font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            "Registrar Ahorro"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

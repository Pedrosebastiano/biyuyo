 import { useState, useEffect } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { ArrowLeftRight } from "lucide-react";
 
 interface CurrencyConverterDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   exchangeRate: number | null;
   rateDate?: string | null;
 }
 
 export function CurrencyConverterDialog({
   open,
   onOpenChange,
   exchangeRate,
   rateDate,
 }: CurrencyConverterDialogProps) {
   const [usdAmount, setUsdAmount] = useState<string>("");
   const [vesAmount, setVesAmount] = useState<string>("");
 
   useEffect(() => {
     if (!open) {
       setUsdAmount("");
       setVesAmount("");
     }
   }, [open]);
 
   const handleUsdChange = (value: string) => {
     setUsdAmount(value);
     if (value && exchangeRate) {
       const numValue = parseFloat(value);
       if (!isNaN(numValue)) {
         setVesAmount((numValue * exchangeRate).toFixed(2));
       } else {
         setVesAmount("");
       }
     } else {
       setVesAmount("");
     }
   };
 
   const handleVesChange = (value: string) => {
     setVesAmount(value);
     if (value && exchangeRate) {
       const numValue = parseFloat(value);
       if (!isNaN(numValue)) {
         setUsdAmount((numValue / exchangeRate).toFixed(2));
       } else {
         setUsdAmount("");
       }
     } else {
       setUsdAmount("");
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[400px] border-2">
         <DialogHeader>
           <DialogTitle className="text-xl font-bold text-[#2d509e] text-center">
             Convertidor de Moneda
           </DialogTitle>
           {rateDate && (
             <p className="text-xs text-muted-foreground text-center">
               Tasa BCV: {rateDate}
             </p>
           )}
         </DialogHeader>
 
         <div className="space-y-6 py-4">
           {/* Exchange Rate Display */}
           <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-xl">
             <span className="font-bold text-lg">$1</span>
             <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
             <span className="font-bold text-lg">
               Bs. {exchangeRate?.toLocaleString("es-VE", {
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
               })}
             </span>
           </div>
 
           {/* USD Input */}
           <div className="space-y-2">
             <Label htmlFor="usd-amount" className="text-sm font-medium">
               Dólares (USD)
             </Label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                 $
               </span>
               <Input
                 id="usd-amount"
                 type="number"
                 placeholder="0.00"
                 value={usdAmount}
                 onChange={(e) => handleUsdChange(e.target.value)}
                 className="pl-8 h-12 text-lg border-2"
               />
             </div>
           </div>
 
           {/* Swap Icon */}
           <div className="flex justify-center">
             <div className="p-2 bg-primary/10 rounded-full">
               <ArrowLeftRight className="h-5 w-5 text-primary rotate-90" />
             </div>
           </div>
 
           {/* VES Input */}
           <div className="space-y-2">
             <Label htmlFor="ves-amount" className="text-sm font-medium">
               Bolívares (VES)
             </Label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                 Bs.
               </span>
               <Input
                 id="ves-amount"
                 type="number"
                 placeholder="0.00"
                 value={vesAmount}
                 onChange={(e) => handleVesChange(e.target.value)}
                 className="pl-10 h-12 text-lg border-2"
               />
             </div>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
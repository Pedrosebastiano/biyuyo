import React from 'react';
import { ReceiptText } from 'lucide-react';
import { cn } from "@/lib/utils";

interface InvoiceButtonProps {
  onClick?: () => void;
  invoiceNumber?: string;
  className?: string;
}

const InvoiceButton = ({ onClick, invoiceNumber, className }: InvoiceButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        // Contenedor principal: Estilo de papel blanco
        "group relative flex flex-col items-center p-3 w-28 bg-white border border-slate-200",
        "text-slate-800 transition-all duration-200 shadow-sm",
        "hover:-rotate-2 hover:shadow-xl hover:-translate-y-1",
        "active:scale-95 active:rotate-0",
        className
      )}
      style={{
        /* Genera el borde dentado (zig-zag) en la parte inferior 
           usando un polígono de recorte (clip-path)
        */
        clipPath: "polygon(0% 0%, 100% 0%, 100% 92%, 95% 100%, 90% 92%, 85% 100%, 80% 92%, 75% 100%, 70% 92%, 65% 100%, 60% 92%, 55% 100%, 50% 92%, 45% 100%, 40% 92%, 35% 100%, 30% 92%, 25% 100%, 20% 92%, 15% 100%, 10% 92%, 5% 100%, 0% 92%)"
      }}
    >
      {/* Línea decorativa superior (pre-corte) */}
      <div className="w-full border-b border-dashed border-slate-300 mb-2 opacity-50"></div>
      
      {/* Icono central con animación al hacer hover */}
      <div className="bg-slate-50 p-2 rounded-full mb-1 group-hover:bg-primary/10 transition-colors">
        <ReceiptText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
      </div>
      
      {/* Textos simulando una factura real */}
      <div className="text-center w-full">
        <p className="text-[8px] uppercase font-black text-slate-400 leading-none tracking-tighter">
          Detalle Pago
        </p>
        <p className="text-[10px] font-mono font-bold truncate mt-1 text-slate-600">
           {invoiceNumber || 'INV-000'}
        </p>
      </div>

      {/* "Líneas de texto" simuladas en el papel */}
      <div className="mt-3 w-full flex flex-col gap-1 opacity-20">
        <div className="h-[2px] bg-slate-400 w-full"></div>
        <div className="h-[2px] bg-slate-400 w-4/5 mx-auto"></div>
        <div className="h-[2px] bg-slate-400 w-3/4"></div>
      </div>

      {/* Sombra interna sutil para dar volumen al papel */}
      <div className="absolute inset-0 pointer-events-none border-l border-white/50 bg-gradient-to-r from-transparent via-transparent to-slate-50/30"></div>
    </button>
  );
};

export default InvoiceButton;
import React, { useState } from "react";
import { useExchangeRate } from "../../hooks/useExchangeRate"; // Ajusta la ruta según tu estructura

export const ExchangeRateCard = () => {
  const { rate, rateDate, isManualNeeded, loading, saveManualRate } =
    useExchangeRate();
  const [inputValue, setInputValue] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputValue);
    if (val > 0) saveManualRate(val);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-700">Tasa Oficial BCV</h3>
        {/* Indicador visual de estado */}
        {!isManualNeeded && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            Automático
          </span>
        )}
      </div>

      {isManualNeeded ? (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <p className="text-sm text-yellow-800">
              No se pudo sincronizar la tasa reciente. Por favor, ingrese el
              valor manualmente.
            </p>
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="00.00"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Guardar
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-800">
              Bs.{" "}
              {rate?.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-gray-500 text-sm font-medium">/ USD</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Fuente: Banco Central de Venezuela
            </p>
            {rateDate && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Fecha valor: {rateDate}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
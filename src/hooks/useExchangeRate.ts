import { useState, useEffect } from "react";

interface RateData {
  date: string;
  value: number;
  lastUpdated: string;
}

export const useExchangeRate = () => {
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null); // Nueva variable para la fecha de la tasa
  const [isManualNeeded, setIsManualNeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Añadimos un timestamp para evitar cache del navegador al leer el JSON
        const res = await fetch(`/rates.json?t=${new Date().getTime()}`);

        if (!res.ok) throw new Error("No se pudo leer rates.json");

        const history: RateData[] = await res.json();

        // Validar que hay datos
        if (history.length === 0) throw new Error("Historial vacío");

        // TOMAMOS EL ÚLTIMO DATO DISPONIBLE (No necesariamente el de "hoy")
        const lastRecord = history[history.length - 1];

        // Verificamos qué tan antigua es la data para no mostrar algo de hace un mes
        // Parseamos DD/MM/YYYY manualmente para evitar errores de navegador
        const [day, month, year] = lastRecord.date.split("/");
        const recordDate = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
        );
        const today = new Date();

        // Calcular diferencia en días
        const diffTime = Math.abs(today.getTime() - recordDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Si la data tiene más de 5 días de antigüedad, pedimos manual
        if (diffDays > 5) {
          console.warn(
            "⚠️ La tasa almacenada es muy antigua (>5 días). Solicitando manual.",
          );
          setIsManualNeeded(true);
        } else {
          // Data válida (es de hoy, ayer o del viernes pasado)
          setRate(lastRecord.value);
          setRateDate(lastRecord.date);
          setIsManualNeeded(false);
        }
      } catch (error) {
        console.error("Error cargando tasas:", error);
        setIsManualNeeded(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, []);

  const saveManualRate = (manualValue: number) => {
    setRate(manualValue);
    // Asignamos fecha de hoy para la UI temporal
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    setRateDate(dateStr);
    setIsManualNeeded(false);
  };

  return { rate, rateDate, isManualNeeded, loading, saveManualRate };
};
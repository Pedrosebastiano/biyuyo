import { useMemo } from "react";

export type Currency = "USD" | "VES";

interface UseCurrencyOptions {
    exchangeRate: number | null;
    currency: Currency;
}

export function useCurrency({ exchangeRate, currency }: UseCurrencyOptions) {
    const convertValue = useMemo(() => {
        return (value: number): number => {
            if (!exchangeRate || currency === "USD") {
                return value;
            }
            // Convert USD to VES: value * exchangeRate
            return value * exchangeRate;
        };
    }, [exchangeRate, currency]);

    const formatCurrency = useMemo(() => {
        return (value: number, options?: { decimals?: number }): string => {
            const decimals = options?.decimals ?? 2;
            const convertedValue = convertValue(value);
            const symbol = currency === "USD" ? "$" : "Bs.";

            return `${symbol}${convertedValue.toLocaleString("es-VE", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}`;
        };
    }, [convertValue, currency]);

    const getCurrencySymbol = (): string => {
        return currency === "USD" ? "$" : "Bs.";
    };

    return {
        convertValue,
        formatCurrency,
        getCurrencySymbol,
        currency,
    };
}

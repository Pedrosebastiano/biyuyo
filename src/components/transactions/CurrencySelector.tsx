import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Currency = "USD" | "VES";

interface CurrencySelectorProps {
  value: Currency;
  onChange: (value: Currency) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Currency)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">$ USD</SelectItem>
        <SelectItem value="VES">Bs. VES</SelectItem>
      </SelectContent>
    </Select>
  );
}

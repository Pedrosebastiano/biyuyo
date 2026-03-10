import React from "react";
import { cn } from "@/lib/utils";

interface SavingsGoalCardProps {
  goal: number;
  text: string;
  currency?: string;
  style?: React.CSSProperties;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, text, currency = "$", style }) => {
  return (

    <div
      className={cn(
        "bg-[#29488e] dark:bg-primary text-white dark:text-primary-foreground rounded-xl p-4 flex items-center justify-center flex-wrap gap-2 font-medium text-base m-4",
        style && (style as any).className
      )}
      style={style}
    >
      <span className="text-sm text-center">{text}</span>
      <span className="font-bold text-lg">
        {currency !== "" ? `${currency}${goal.toFixed(2)}` : goal.toFixed(2)}
      </span>
    </div>
  );
};

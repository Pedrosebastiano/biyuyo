import React from "react";

interface SavingsGoalCardProps {
  goal: number;
  text: string;
  currency?: string;
  style?: React.CSSProperties;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, text, currency = "$", style }) => {
  return (

    <div
      style={{
        background: "#29488e",
        borderRadius: 12,
        padding: "1rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        color: "#fff",
        fontWeight: 500,
        fontSize: 16,
        margin: "1rem",
        ...style
      }}
    >
      <span style={{ fontSize: 14, textAlign: "center" }}>{text}</span>
      <span style={{ fontWeight: 700, fontSize: 18 }}>
        {currency !== "" ? `${currency}${goal.toFixed(2)}` : goal.toFixed(2)}
      </span>
    </div>
  );
};

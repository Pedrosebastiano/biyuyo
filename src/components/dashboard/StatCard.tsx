import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-card",
  success: "bg-accent",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-primary text-primary-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn("border-2 transition-all hover:shadow-md overflow-hidden", variantStyles[variant])}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs lg:text-sm font-medium",
                trend.isPositive ? "text-primary" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={cn("p-2 lg:p-3 rounded-lg shrink-0 hidden sm:flex", iconStyles[variant])}>
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

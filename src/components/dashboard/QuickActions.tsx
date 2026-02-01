import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, Users, Receipt } from "lucide-react";

const actions = [
  { label: "Add Transaction", icon: Plus, variant: "default" as const },
  { label: "View Analytics", icon: TrendingUp, variant: "outline" as const },
  { label: "Shared Accounts", icon: Users, variant: "outline" as const },
  { label: "Scan Receipt", icon: Receipt, variant: "outline" as const },
];

export function QuickActions() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto py-4 flex-col gap-2 border-2"
          >
            <action.icon className="h-5 w-5" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

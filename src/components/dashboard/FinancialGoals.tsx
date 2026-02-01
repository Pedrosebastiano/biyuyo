import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Plane, GraduationCap } from "lucide-react";

const goals = [
  { 
    id: 1, 
    name: "Emergency Fund", 
    current: 3500, 
    target: 5000, 
    icon: Target,
    color: "bg-primary" 
  },
  { 
    id: 2, 
    name: "Vacation Trip", 
    current: 800, 
    target: 2000, 
    icon: Plane,
    color: "bg-chart-2" 
  },
  { 
    id: 3, 
    name: "Education", 
    current: 1200, 
    target: 3000, 
    icon: GraduationCap,
    color: "bg-chart-3" 
  },
];

export function FinancialGoals() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Financial Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const percentage = Math.round((goal.current / goal.target) * 100);
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <goal.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{goal.name}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <p className="text-sm text-muted-foreground text-right">{percentage}% complete</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

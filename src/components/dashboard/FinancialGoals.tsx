import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Rocket, Star, Heart, Briefcase, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const iconMap: Record<string, any> = {
  target: Target,
  travel: Rocket,
  savings: Star,
  personal: Heart,
  work: Briefcase,
};

export function FinancialGoals() {
  const { user } = useAuth();
  const { activeSharedProfile } = useSharedProfile();
  const { goals, loading } = useGoals(
    user?.user_id || "",
    activeSharedProfile?.shared_id
  );

  if (loading) {
    return (
      <Card className="border-2 animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-2 w-full bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayGoals = goals.slice(0, 3); // Solo mostrar las 3 primeras en el dashboard

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          {activeSharedProfile ? "Ahorro Grupal" : "Metas de Ahorro"}
        </CardTitle>
        <Link to="/goals">
          <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        {displayGoals.length > 0 ? (
          displayGoals.map((goal) => {
            const percentage = Math.round((goal.current_amount / goal.target_amount) * 100);
            const Icon = iconMap[goal.icon] || Target;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm truncate max-w-[120px]">{goal.title}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    ${Number(goal.current_amount).toLocaleString()} / ${Number(goal.target_amount).toLocaleString()}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-right">{percentage}% completado</p>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target className="h-10 w-10 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground mb-4">No tienes metas configuradas</p>
            <Link to="/goals">
              <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs">
                Crear Meta
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

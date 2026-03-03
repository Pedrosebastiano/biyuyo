import React, { useState } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { AddGoalDialog } from "@/goals/AddGoalDialog";
import { cn } from "@/lib/utils";

// Componente Interno para la Card de Meta
function GoalCard({ goal, onDeleted }: { goal: any, onDeleted: (id: string) => void }) {
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 transition-all hover:shadow-md bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
          <Target size={20} />
        </div>
        <span className="text-xs font-semibold bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border">
          {Math.round(progress)}%
        </span>
      </div>
      <h3 className="font-bold text-lg mb-1">{goal.title}</h3>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">${goal.current_amount.toLocaleString()}</span>
        <span className="text-muted-foreground">meta: ${goal.target_amount.toLocaleString()}</span>
      </div>
      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { goals, loading } = useGoals(user?.user_id || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estado para borrado optimista (igual que en tus transacciones)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const handleDeleted = (id: string) => setDeletedIds((prev) => new Set(prev).add(id));

  const visibleGoals = goals.filter((g) => !deletedIds.has(g.id));

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Inicia sesión para ver tus metas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Layout idéntico a Transacciones */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="lg:pl-72">
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="p-4 pt-20 pb-24 lg:p-6 lg:pt-6 lg:pb-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#2d509e]">Mis Metas</h1>
                <p className="text-muted-foreground mt-1">Ahorra para lo que más importa.</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-full shadow-lg">
                <Plus className="h-4 w-4 mr-2" /> Nueva Meta
              </Button>
            </div>

            {loading ? (
              <p className="text-center py-10">Cargando metas...</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {visibleGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onDeleted={handleDeleted} />
                ))}
              </div>
            )}

            {visibleGoals.length === 0 && !loading && (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aún no tienes metas creadas.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
      
      <AddGoalDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        />
    </div>
  );
}
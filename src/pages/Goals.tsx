import React, { useState } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, Calendar, Trash2, Rocket, Star, Heart, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { AddGoalDialog } from "@/goals/AddGoalDialog";
import { UpdateProgressDialog } from "@/goals/UpdateProgressDialog";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = getApiUrl();

const iconMap: Record<string, any> = {
  target: Target,
  travel: Rocket,
  savings: Star,
  personal: Heart,
  work: Briefcase,
};

// Componente Interno para la Card de Meta
function GoalCard({ goal, onDeleted, onOpenUpdate }: {
  goal: any,
  onDeleted: (id: string) => void,
  onOpenUpdate: (goal: any) => void
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const Icon = iconMap[goal.icon] || Target;

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/goals/${goal.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Meta eliminada");
        onDeleted(goal.id);
      } else {
        toast.error("Error al eliminar la meta");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 transition-all hover:shadow-md bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
          <Icon size={20} />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-muted-foreground hover:text-destructive h-8 w-8">
            <Trash2 size={16} />
          </Button>
          <span className="text-xs font-semibold bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border flex items-center">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-1">{goal.title}</h3>

      <div className="flex items-center text-xs text-muted-foreground mb-3 gap-1">
        <Calendar size={12} />
        <span>Límite: {new Date(goal.deadline).toLocaleDateString()}</span>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-primary">${Number(goal.current_amount).toLocaleString()}</span>
        <span className="text-muted-foreground">meta: ${Number(goal.target_amount).toLocaleString()}</span>
      </div>

      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Button onClick={() => onOpenUpdate(goal)} variant="outline" size="sm" className="w-full rounded-xl text-xs flex gap-1 h-9">
        <TrendingUp size={14} />
        Actualizar Progreso
      </Button>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se perderá el seguimiento de "{goal.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { goals, loading, setGoals, refreshGoals } = useGoals(user?.user_id || "");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const handleDeleted = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleOpenUpdate = (goal: any) => {
    setSelectedGoal(goal);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateProgress = async (id: string, newAmount: number) => {
    try {
      const response = await fetch(`${API_URL}/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_amount: newAmount }),
      });
      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
        toast.success("¡Progreso actualizado!");
      } else {
        toast.error("Error al actualizar progreso");
      }
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast.error("Error de conexión");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Inicia sesión para ver tus metas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-full shadow-lg h-11 px-6">
                <Plus className="h-5 w-5 mr-2" /> Nueva Meta
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Cargando tus metas...</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDeleted={handleDeleted}
                    onOpenUpdate={handleOpenUpdate}
                  />
                ))}
              </div>
            )}

            {goals.length === 0 && !loading && (
              <div className="text-center py-24 border-2 border-dashed rounded-[2.5rem] bg-muted/5">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No hay metas activas</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                  Empieza a planificar tus ahorros creando tu primera meta.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="rounded-2xl">
                  Crear mi primera meta
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      <AddGoalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refreshGoals}
      />

      <UpdateProgressDialog
        goal={selectedGoal}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        onUpdate={handleUpdateProgress}
      />
    </div>
  );
}
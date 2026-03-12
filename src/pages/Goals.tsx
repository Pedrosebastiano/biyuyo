import React, { useState, useEffect } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, Calendar, Trash2, Rocket, Star, Heart, Briefcase, Users, History, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { AddGoalDialog } from "@/goals/AddGoalDialog";
import { UpdateProgressDialog } from "@/goals/UpdateProgressDialog";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/contexts/OnboardingContext";
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
  const [showHistory, setShowHistory] = useState(false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const Icon = iconMap[goal.icon] || Target;

  const fetchContributions = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setLoadingContributions(true);
    try {
      const response = await fetch(`${API_URL}/goals/${goal.id}/contributions`);
      if (response.ok) {
        const data = await response.json();
        setContributions(data);
        setShowHistory(true);
      }
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setLoadingContributions(false);
    }
  };

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
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 transition-all hover:shadow-md bg-gradient-to-br from-primary/10 to-transparent">
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

      <div className="flex gap-2">
        <Button onClick={() => onOpenUpdate(goal)} variant="outline" size="sm" className="flex-1 rounded-xl text-xs flex gap-1 h-9">
          <TrendingUp size={14} />
          Aportar
        </Button>
        <Button onClick={fetchContributions} variant="ghost" size="sm" className="rounded-xl h-9 px-3 text-muted-foreground">
          {loadingContributions ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            showHistory ? <ChevronUp size={16} /> : <History size={16} />
          )}
        </Button>
      </div>

      {showHistory && (
        <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
            <Users size={12} /> Contribuciones
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {contributions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2 italic">Sin aportes registrados todavía.</p>
            ) : (
              // Agrupar por usuario para mostrar totales por persona
              Object.values(contributions.reduce((acc: any, curr: any) => {
                if (!acc[curr.user_name]) {
                  acc[curr.user_name] = { name: curr.user_name, total: 0, count: 0 };
                }
                acc[curr.user_name].total += Number(curr.amount);
                acc[curr.user_name].count += 1;
                return acc;
              }, {})).map((contrib: any) => (
                <div key={contrib.name} className="flex justify-between items-center bg-background/40 p-2 rounded-xl border border-primary/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{contrib.name}</span>
                    <span className="text-[10px] text-muted-foreground">{contrib.count} aporte{contrib.count !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">+${Number(contrib.total).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
  const { activeSharedProfile } = useSharedProfile();
  const { goals, loading, setGoals, refreshGoals } = useGoals(
    user?.user_id || "",
    activeSharedProfile?.shared_id
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const { isOnboarding, registerAction, unregisterAction } = useOnboarding();

  // Register onboarding actions to open/close goal dialog
  useEffect(() => {
    registerAction("open-goal-dialog", () => {
      setIsAddDialogOpen(true);
    });
    registerAction("close-goal-dialog", () => {
      setIsAddDialogOpen(false);
    });
    return () => {
      unregisterAction("open-goal-dialog");
      unregisterAction("close-goal-dialog");
    };
  }, [registerAction, unregisterAction]);

  const handleDeleted = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleOpenUpdate = (goal: any) => {
    setSelectedGoal(goal);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateProgress = async (id: string, newAmount: number) => {
    try {
      // Usamos el endpoint de contribución si estamos en perfil compartido o queremos tracking
      const response = await fetch(`${API_URL}/goals/${id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id,
          amount: newAmount // Aquí el diálogo ahora pasará el "delta" (incremento)
        }),
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
              <div data-onboarding="goals-page-title">
                <h1 className="text-3xl font-bold tracking-tight text-primary">
                  {activeSharedProfile ? `Metas: ${activeSharedProfile.name}` : "Mis Metas"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {activeSharedProfile ? "Metas colectivas del grupo." : "Ahorra para lo que más importa."}
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-full shadow-lg h-11 px-6" data-onboarding="new-goal-btn">
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
        sharedId={activeSharedProfile?.shared_id}
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
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tutorial step definitions ──────────────────────────────────────────────
export interface TutorialStep {
  /** data-onboarding attribute value of the target element */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description shown in the tooltip */
  description: string;
  /** Route that must be active for this step (navigate if needed) */
  route: string;
  /** Optional: action to run when ENTERING this step */
  action?: string;
  /** Optional: action to run when LEAVING this step */
  reverseAction?: string;
  /** Position of the tooltip relative to the spotlight */
  placement?: "top" | "bottom" | "left" | "right" | "center" | "bottom-fixed";
}

const BASE_STEPS: TutorialStep[] = [
  // ── Step 0: Welcome ──
  {
    target: "dashboard-content",
    title: "👋 ¡Bienvenido a Biyuyo!",
    description: "Esta es tu plataforma de finanzas personales. Te guiaremos por las funcionalidades principales para que aproveches al máximo la app. ¡Empecemos!",
    route: "/",
    placement: "center",
  },
  // ── Step 1: Quick Actions ──
  {
    target: "quick-actions",
    title: "🏠 Acciones Rápidas",
    description: "Desde aquí puedes registrar gastos, ingresos y recordatorios de forma rápida. ¡Es el centro de control de tus finanzas!",
    route: "/",
    placement: "bottom",
  },
  // ── Step 2: Add Transaction Button (NO action — just highlight) ──
  {
    target: "add-transaction-btn",
    title: "➕ Agregar Transacción",
    description: "Este botón te permite crear una nueva transacción en segundos. ¡Haz clic para registrar gastos, ingresos o recordatorios!",
    route: "/",
    placement: "bottom",
  },
  // ── Step 3: Transaction Form (opens dialog, highlights entire form) ──
  {
    target: "transaction-dialog-content",
    title: "📋 Registro de Transacciones",
    description: "Aquí puedes registrar un Gasto 💸, un Ingreso 💰 o un Recordatorio 🔔. Cada pestaña tiene su formulario especializado. ¡Completa los datos y guarda!",
    route: "/",
    placement: "bottom-fixed",
    action: "open-transaction-dialog",
    reverseAction: "close-transaction-dialog",
  },
  // ── Step 4: Bottom Navigation ──
  {
    target: "bottom-nav",
    title: "📱 Barra de Navegación",
    description: "Esta es tu barra de navegación. Desde aquí puedes acceder a todas las secciones de la app: Dashboard, Transacciones, Metas, Estadísticas y Predictor IA.",
    route: "/",
    placement: "top",
  },
  // ── Step 5: Transactions Page ──
  {
    target: "transactions-page-title",
    title: "💳 Transacciones",
    description: "Aquí puedes ver el historial completo de tus gastos, ingresos y recordatorios. Filtra, busca y gestiona todas tus transacciones.",
    route: "/transactions",
    placement: "bottom",
  },
  // ── Step 6: Analytics Page ──
  {
    target: "analytics-page-title",
    title: "📊 Estadísticas",
    description: "Visualiza tus finanzas con gráficos interactivos. Analiza tus gastos por categoría, compara ingresos vs gastos y descubre tendencias.",
    route: "/analytics",
    placement: "bottom",
  },
  // ── Step 7: Goals Page Intro ──
  {
    target: "goals-page-title",
    title: "🎯 Metas Financieras",
    description: "En esta sección puedes crear y gestionar tus metas de ahorro. Establece objetivos, haz aportes y sigue tu progreso visualmente.",
    route: "/goals",
    placement: "bottom",
  },
  // ── Step 8: New Goal Button (NO action — just highlight) ──
  {
    target: "new-goal-btn",
    title: "➕ Crear Nueva Meta",
    description: "Haz clic aquí para definir tu próximo objetivo financiero. Puedes elegir un ícono, establecer un monto y una fecha límite.",
    route: "/goals",
    placement: "bottom",
  },
  // ── Step 9: Goal Form (opens dialog, highlights entire form) ──
  {
    target: "goal-dialog-content",
    title: "📝 Registro de Meta",
    description: "Define el nombre de tu meta, el monto objetivo, tu ahorro inicial y la fecha límite. ¡Empieza a ahorrar para lo que más importa!",
    route: "/goals",
    placement: "bottom-fixed",
    action: "open-goal-dialog",
    reverseAction: "close-goal-dialog",
  },
  // ── Step 10: ML Page Intro ──
  {
    target: "ml-page-title",
    title: "🤖 Predictor IA",
    description: "Esta sección utiliza inteligencia artificial para ayudarte a tomar mejores decisiones financieras. Entrena tu modelo personal y simula gastos futuros.",
    route: "/ml",
    placement: "bottom",
  },
  // ── Step 11: Decision Predictor ──
  {
    target: "decision-predictor",
    title: "⚡ Predictor de Decisión",
    description: "Antes de gastar, consulta a la IA: selecciona la categoría y el monto, y te dirá si es una buena decisión financiera basada en tu situación actual.",
    route: "/ml",
    placement: "bottom-fixed",
  },
];

const UNIMET_STEPS: TutorialStep[] = [
  {
    target: "header-profile-btn",
    title: "🎓 Navegación a Perfil",
    description: "Detectamos que tienes un correo de la Unimet. Puedes verificar tu cuenta para obtener Premium gratis. Entra al menú de tu perfil aquí.",
    route: "/",
    placement: "bottom",
  },
  {
    target: "unimet-verification-card",
    title: "⭐ Premium Gratis",
    description: "Aquí podrás solicitar tu código de verificación a tu correo institucional y activar tu cuenta Premium sin costo alguno.",
    route: "/profile",
    placement: "top",
  }
];

const COMPLETE_STEP: TutorialStep = {
  target: "dashboard-content",
  title: "🎉 ¡Tutorial Completado!",
  description: "¡Ya conoces las funcionalidades principales de Biyuyo! Explora cada sección a tu ritmo. ¡Éxito manejando tus finanzas! 🚀",
  route: "/",
  placement: "center",
};

// ─── Context types ──────────────────────────────────────────────────────────
interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TutorialStep | null;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;
  /** Callbacks that pages can register to react to onboarding actions */
  registerAction: (action: string, callback: () => void) => void;
  unregisterAction: (action: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY_COMPLETE = "biyuyo_onboarding_complete";
const STORAGE_KEY_PENDING = "biyuyo_onboarding_pending";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const actionCallbacksRef = useRef<Record<string, () => void>>({});

  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically attach UNIMET completion steps if applicable
  const tutorialSteps = useMemo(() => {
    const isUnimet =
      user?.email &&
      (user.email.endsWith("@unimet.edu.ve") ||
        user.email.endsWith("@correo.unimet.edu.ve"));

    if (isUnimet) {
      return [...BASE_STEPS, ...UNIMET_STEPS, COMPLETE_STEP];
    }
    return [...BASE_STEPS, COMPLETE_STEP];
  }, [user]);

  // Check for pending onboarding on mount AND on route changes
  useEffect(() => {
    if (isOnboarding) return; // Don't restart if already running
    const pending = localStorage.getItem(STORAGE_KEY_PENDING);
    const completed = localStorage.getItem(STORAGE_KEY_COMPLETE);
    if (pending === "true" && completed !== "true") {
      const timer = setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY_PENDING);
        setIsOnboarding(true);
        setCurrentStep(0);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isOnboarding]);

  const triggerAction = useCallback((action: string) => {
    const cb = actionCallbacksRef.current[action];
    if (cb) cb();
  }, []);

  // Handle step transitions: navigate, trigger reverseAction of old step, then action of new step
  const transitionToStep = useCallback(
    (fromStep: number, toStep: number) => {
      const oldStepData = tutorialSteps[fromStep];
      const newStepData = tutorialSteps[toStep];
      if (!newStepData) return;

      // 1. Trigger reverseAction of the step we're LEAVING
      if (oldStepData?.reverseAction) {
        triggerAction(oldStepData.reverseAction);
      }

      // 2. Navigate if needed
      if (location.pathname !== newStepData.route) {
        navigate(newStepData.route);
      }

      // 3. Set the step
      setCurrentStep(toStep);

      // 4. Trigger action of the new step after DOM settles
      if (newStepData.action) {
        setTimeout(() => {
          triggerAction(newStepData.action!);
        }, 400);
      }
    },
    [triggerAction, navigate, location.pathname, tutorialSteps]
  );

  const startOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_COMPLETE);
    setCurrentStep(0);
    setIsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    // Clean up: trigger reverseAction of current step if any
    const currentStepData = tutorialSteps[currentStep];
    if (currentStepData?.reverseAction) {
      triggerAction(currentStepData.reverseAction);
    }
    localStorage.setItem(STORAGE_KEY_COMPLETE, "true");
    localStorage.removeItem(STORAGE_KEY_PENDING);
    setIsOnboarding(false);
    setCurrentStep(0);
  }, [currentStep, triggerAction, tutorialSteps]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const nextStep = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      transitionToStep(currentStep, currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, tutorialSteps.length, transitionToStep, completeOnboarding]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      transitionToStep(currentStep, currentStep - 1);
    }
  }, [currentStep, transitionToStep]);

  const registerAction = useCallback((action: string, callback: () => void) => {
    actionCallbacksRef.current[action] = callback;
  }, []);

  const unregisterAction = useCallback((action: string) => {
    delete actionCallbacksRef.current[action];
  }, []);

  const currentStepData = isOnboarding ? tutorialSteps[currentStep] ?? null : null;

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        totalSteps: tutorialSteps.length,
        currentStepData,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        startOnboarding,
        registerAction,
        unregisterAction,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

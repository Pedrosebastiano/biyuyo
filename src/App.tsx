import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import Consent from "./pages/Consent";
import ML from "./pages/ML";
import SharedProfiles from "./pages/SharedProfiles";
import JoinSharedProfile from "./pages/JoinSharedProfile";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SharedProfileProvider } from "@/contexts/SharedProfileContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import Goals from "./pages/Goals"; // Importamos la nueva página de Metas
import Configuration from "./pages/Configuration.tsx"; // Importamos la nueva página de Configuración
import Appearance from "./pages/Appearance.tsx"; // Importamos la nueva página de Apariencia
import { AdBanner } from "@/components/layout/AdBanner";

const queryClient = new QueryClient();

import { ReminderNotificationManager } from "@/components/ReminderNotificationManager";
import { usePushNotification } from "@/hooks/use-push-notification";

const AppInitializer = () => {
  usePushNotification();
  return <ReminderNotificationManager />;
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/oauth/consent" element={<Consent />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/ml" element={<ProtectedRoute><ML /></ProtectedRoute>} />
    <Route path="/shared" element={<ProtectedRoute><SharedProfiles /></ProtectedRoute>} />
    <Route path="/shared/join/:shareCode" element={<ProtectedRoute><JoinSharedProfile /></ProtectedRoute>} />
    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
    <Route path="/configuration" element={<ProtectedRoute><Configuration /></ProtectedRoute>} />
    <Route path="/appearance" element={<ProtectedRoute><Appearance /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/*
           * PrivacyProvider va DENTRO de AuthProvider para poder llamar useAuth()
           * y cargar la preferencia correcta según el user_id activo.
           */}
          <PrivacyProvider>
            <OnboardingProvider>
              <SharedProfileProvider>
                <AppInitializer />
                <AppRoutes />
                <AdBanner />
                <OnboardingOverlay />
              </SharedProfileProvider>
            </OnboardingProvider>
          </PrivacyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
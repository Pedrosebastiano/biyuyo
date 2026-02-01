import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader exchangeRate={36.50} />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="p-4 pt-18 pb-20 lg:p-6 lg:pt-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { MonthlySavingsChart } from "@/components/dashboard/MonthlySavingsChart";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmergencyFund } from "@/components/dashboard/EmergencyFund";
import { DebtRatio } from "@/components/dashboard/DebtRatio";
//import { CategoryChart } from "@/components/dashboard/CategoryChart";

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Analytics and insights will be displayed here.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <IncomeExpenseChart />
          <ExpenseChart />
          <MonthlySavingsChart />
          <EmergencyFund />
          <DebtRatio />
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

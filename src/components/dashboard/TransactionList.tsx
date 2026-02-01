import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Zap, 
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExchangeRateCard } from "../ui/ExchangeRateCard";

const categoryIcons: Record<string, React.ElementType> = {
  shopping: ShoppingCart,
  housing: Home,
  transport: Car,
  food: Utensils,
  utilities: Zap,
  income: Briefcase,
};

const transactions = [
  { id: 1, description: "Monthly Salary", amount: 4500, type: "income", category: "income", date: "Today" },
  { id: 2, description: "Grocery Store", amount: -85.50, type: "expense", category: "food", date: "Today" },
  { id: 3, description: "Electric Bill", amount: -120.00, type: "expense", category: "utilities", date: "Yesterday" },
  { id: 4, description: "Uber Ride", amount: -24.50, type: "expense", category: "transport", date: "Yesterday" },
  { id: 5, description: "Rent Payment", amount: -1200.00, type: "expense", category: "housing", date: "Feb 1" },
  { id: 6, description: "Online Shopping", amount: -156.99, type: "expense", category: "shopping", date: "Jan 30" },
  { id: 7, description: "Freelance Project", amount: 800.00, type: "income", category: "income", date: "Jan 28" },
];

export function TransactionList() {
  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <ExchangeRateCard/>
        <Badge variant="secondary" className="font-mono">
          {transactions.length} transactions
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {transactions.map((transaction) => {
              const Icon = categoryIcons[transaction.category] || ShoppingCart;
              const isIncome = transaction.type === "income";
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isIncome ? "bg-accent" : "bg-muted"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono font-semibold",
                      isIncome ? "text-primary" : "text-foreground"
                    )}>
                      {isIncome ? "+" : ""}{transaction.amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
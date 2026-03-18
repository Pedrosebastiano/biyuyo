import { createContext, useContext, useState, useCallback } from "react";

interface TransactionRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const TransactionRefreshContext = createContext<TransactionRefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function TransactionRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <TransactionRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </TransactionRefreshContext.Provider>
  );
}

export function useTransactionRefresh() {
  return useContext(TransactionRefreshContext);
}

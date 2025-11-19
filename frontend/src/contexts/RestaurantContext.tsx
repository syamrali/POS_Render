import * as React from "react";
import * as api from "../services/api";

// Define interfaces directly to avoid conflicts
interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied';
  seats: number;
  category: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  category: string;
  department: string;
  quantity: number;
  sentToKitchen?: boolean;
}

interface TableOrder {
  tableId: string;
  tableName: string;
  items: OrderItem[];
  startTime: string;
}

interface Invoice {
  id: string;
  billNumber: string;
  orderType: 'dine-in' | 'takeaway';
  tableName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
}

export interface KOTConfig {
  printByDepartment: boolean;
  numberOfCopies: number;
  selectedPrinter?: string | null;
  paperSize?: string | null;
  formatType?: string | null;
}

export interface BillConfig {
  autoPrintDineIn: boolean;
  autoPrintTakeaway: boolean;
  selectedPrinter?: string | null;
  paperSize?: string | null;
  formatType?: string | null;
}

interface RestaurantContextType {
  tables: Table[];
  setTables: (tables: Table[]) => void;
  tableOrders: Map<string, TableOrder>;
  addItemsToTable: (tableId: string, tableName: string, items: OrderItem[]) => Promise<void>;
  getTableOrder: (tableId: string) => TableOrder | undefined;
  completeTableOrder: (tableId: string) => Promise<void>;
  markItemsAsSent: (tableId: string) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => Promise<void>;
  kotConfig: KOTConfig;
  updateKotConfig: (config: KOTConfig) => Promise<void>;
  billConfig: BillConfig;
  updateBillConfig: (config: BillConfig) => Promise<void>;
}

const RestaurantContext = React.createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = React.useState<Table[]>([]);
  const [tableOrders, setTableOrders] = React.useState<Map<string, TableOrder>>(new Map());
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [kotConfig, setKotConfig] = React.useState<KOTConfig>({
    printByDepartment: false,
    numberOfCopies: 1,
    selectedPrinter: null,
    paperSize: null,
    formatType: null,
  });
  const [billConfig, setBillConfig] = React.useState<BillConfig>({
    autoPrintDineIn: false,
    autoPrintTakeaway: false,
    selectedPrinter: null,
    paperSize: null,
    formatType: null,
  });

  // Load data from API on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load tables
        const tablesData = await api.getTables();
        setTables(tablesData);
        
        // Load all table orders from backend
        const ordersMap = new Map<string, TableOrder>();
        for (const table of tablesData) {
          if (table.status === 'occupied') {
            try {
              const order = await api.getTableOrder(table.id);
              if (order && order.items) {
                ordersMap.set(table.id, order);
              }
            } catch (err) {
              console.error(`Failed to load order for table ${table.id}:`, err);
            }
          }
        }
        setTableOrders(ordersMap);
        
        // Load invoices
        const invoicesData = await api.getInvoices();
        setInvoices(invoicesData);
        
        // Load configs
        const kotConfigData = await api.getKOTConfig();
        setKotConfig(kotConfigData);
        
        const billConfigData = await api.getBillConfig();
        setBillConfig(billConfigData);
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to initial data
        setTables([
          { id: "1", name: "A1", seats: 2, category: "General", status: "available" },
          { id: "2", name: "A2", seats: 2, category: "General", status: "available" },
          { id: "3", name: "B1", seats: 4, category: "Family", status: "available" },
          { id: "4", name: "B2", seats: 4, category: "Family", status: "available" },
          { id: "5", name: "M1", seats: 6, category: "Mandi", status: "available" },
          { id: "6", name: "M2", seats: 6, category: "Mandi", status: "available" },
          { id: "7", name: "VIP1", seats: 8, category: "Party Hall", status: "available" },
          { id: "8", name: "C1", seats: 4, category: "General", status: "available" },
        ]);
      }
    };
    
    loadData();
  }, []);

  const addItemsToTable = async (tableId: string, tableName: string, newItems: OrderItem[]) => {
    try {
      const updatedOrder = await api.addItemsToTable(tableId, tableName, newItems);
      
      setTableOrders(prev => {
        const newMap = new Map(prev);
        newMap.set(tableId, updatedOrder);
        return newMap;
      });

      // Update table status
      setTables(prev =>
        prev.map(table =>
          table.id === tableId ? { ...table, status: "occupied" } : table
        )
      );
    } catch (error) {
      console.error("Error adding items to table:", error);
    }
  };

  const markItemsAsSent = async (tableId: string) => {
    try {
      const updatedOrder = await api.markItemsAsSent(tableId);
      
      setTableOrders(prev => {
        const newMap = new Map(prev);
        const order = newMap.get(tableId);
        if (order) {
          newMap.set(tableId, updatedOrder);
        }
        return newMap;
      });
    } catch (error) {
      console.error("Error marking items as sent:", error);
    }
  };

  const getTableOrder = (tableId: string): TableOrder | undefined => {
    return tableOrders.get(tableId);
  };

  const completeTableOrder = async (tableId: string) => {
    try {
      await api.completeTableOrder(tableId);
      
      setTableOrders(prev => {
        const newMap = new Map(prev);
        newMap.delete(tableId);
        return newMap;
      });

      // Update table status
      setTables(prev =>
        prev.map(table =>
          table.id === tableId ? { ...table, status: "available" } : table
        )
      );
    } catch (error) {
      console.error("Error completing table order:", error);
    }
  };

  const addInvoice = async (invoice: Invoice) => {
    try {
      const newInvoice = await api.addInvoice(invoice);
      
      setInvoices(prev => [newInvoice, ...prev]);
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  const updateKotConfig = async (config: KOTConfig) => {
    try {
      const updatedConfig = await api.updateKOTConfig(config);
      // Update local state
      setKotConfig(updatedConfig);
    } catch (error) {
      console.error("Error updating KOT config:", error);
    }
  };

  const updateBillConfig = async (config: BillConfig) => {
    try {
      const updatedConfig = await api.updateBillConfig(config);
      // Update local state
      setBillConfig(updatedConfig);
    } catch (error) {
      console.error("Error updating bill config:", error);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        setTables,
        tableOrders,
        addItemsToTable,
        getTableOrder,
        completeTableOrder,
        markItemsAsSent,
        invoices,
        addInvoice,
        kotConfig,
        updateKotConfig,
        billConfig,
        updateBillConfig,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = React.useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
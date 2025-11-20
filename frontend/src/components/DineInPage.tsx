import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, ShoppingCart, Trash2, Printer, Clock, Search, ChevronLeft } from "lucide-react";
import { Input } from "./ui/input";
import { useRestaurant } from "../contexts/RestaurantContext";
import * as api from "../services/api";
import { MenuItem, Table } from "../types";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sentToKitchen?: boolean;
  department?: string;
}

// Define interface for pending orders
interface PendingOrder {
  id: string;
  tableId: string;
  tableName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
}

export const DineInPage: React.FC = () => {
  const {
    tables,
    setTables,
    addItemsToTable,
    getTableOrder,
    completeTableOrder,
    markItemsAsSent,
    addInvoice,
    kotConfig,
    billConfig,
  } = useRestaurant();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Clear selected table when component mounts to always show table selection
  useEffect(() => {
    // Reset to table selection view on mount
    setSelectedTable("");
    setCurrentOrder([]);
    localStorage.removeItem('dineInSelectedTable');
  }, []);

  // Save selected table to localStorage when it changes
  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem('dineInSelectedTable', selectedTable);
    } else {
      localStorage.removeItem('dineInSelectedTable');
    }
  }, [selectedTable]);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every minute for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [items, cats] = await Promise.all([api.getMenuItems(), api.getCategories()]);
        if (!mounted) return;
        setMenuItems(items || []);
        setCategories(["All", ...(cats || []).map((c: any) => c.name || c)]);
      } catch (err) {
        console.error("Failed to load menu data", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load tables when component mounts
  useEffect(() => {
    const loadTables = async () => {
      try {
        const loadedTables = await api.getTables();
        setTables(loadedTables || []);

        // Also load table orders for all tables
        for (const table of loadedTables) {
          if (table.status === 'occupied') {
            try {
              const order = await api.getTableOrder(table.id);
              if (order) {
                // Update the context with the loaded order
                // This will be handled by the RestaurantContext
              }
            } catch (err) {
              console.error(`Failed to load order for table ${table.id}`, err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load tables", err);
      }
    };

    loadTables();
  }, []);





  // Reset state when component unmounts
  useEffect(() => {
    console.log("DineInPage mounted");
    return () => {
      // Cleanup function when component unmounts
      console.log("DineInPage unmounted");
    };
  }, []);



  // Load data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Reload menu items and categories if needed
        const [items, cats] = await Promise.all([api.getMenuItems(), api.getCategories()]);
        setMenuItems(items || []);
        setCategories(["All", ...(cats || []).map((c: any) => c.name || c)]);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    loadInitialData();
  }, []);



  // Load existing table order when selectedTable changes OR when tableOrders in context changes
  useEffect(() => {
    if (selectedTable && tables.length > 0) {
      const table = tables.find((t: Table) => t.id === selectedTable);
      if (table && table.status === "occupied") {
        // Try to load existing order from context first
        const order = getTableOrder(selectedTable);
        if (order && order.items) {
          // Load the existing items into the current order state
          const cartItems: CartItem[] = order.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            sentToKitchen: item.sentToKitchen || false,
            department: item.department
          }));
          setCurrentOrder(cartItems);
        } else {
          // If no order in context, try to fetch from API
          api.getTableOrder(selectedTable).then(fetchedOrder => {
            if (fetchedOrder && fetchedOrder.items) {
              const cartItems: CartItem[] = fetchedOrder.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                sentToKitchen: item.sentToKitchen || false,
                department: item.department
              }));
              setCurrentOrder(cartItems);
            }
          }).catch(err => {
            console.error("Failed to fetch table order", err);
          });
        }
      } else if (table && table.status === "available") {
        // If table is available, clear the current order
        setCurrentOrder([]);
      }
    }
  }, [selectedTable, tables, getTableOrder]);

  const selectedTableData = useMemo(() => {
    const data = tables.find((t: Table) => t.id === selectedTable);
    console.log("Selected table data:", data);
    return data;
  }, [tables, selectedTable]);

  const existingTableOrder = useMemo(() => {
    const order = selectedTable ? getTableOrder(selectedTable) : undefined;
    console.log("Existing table order:", order);
    return order;
  }, [selectedTable, getTableOrder]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const byCat = selectedCategory === "All" || item.category === selectedCategory;
      const bySearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.productCode?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
      return byCat && bySearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const getPendingItems = useCallback(() => currentOrder.filter((it) => !it.sentToKitchen), [currentOrder]);

  const getAllCombinedItems = useCallback(() => {
    return currentOrder;
  }, [currentOrder]);

  const subtotal = useMemo(() => {
    return getAllCombinedItems().reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0);
  }, [getAllCombinedItems]);

  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  // Format time helper function
  const formatTimeAgo = useCallback((startTime: string | Date) => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const diffMs = currentTime - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else {
      return `${diffMins}m`;
    }
  }, [currentTime]);

  // Format date time helper
  const formatDateTime = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, []);

  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTable(tableId);

    // If table is occupied, automatically load existing order
    const table = tables.find((t: Table) => t.id === tableId);
    if (table && table.status === "occupied") {
      const order = getTableOrder(tableId);
      if (order && order.items) {
        // Load the existing items into the current order state
        const cartItems: CartItem[] = order.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sentToKitchen: item.sentToKitchen || false,
          department: item.department
        }));
        setCurrentOrder(cartItems);
      }
    }
  }, [tables, getTableOrder]);
  const handleCategorySelect = useCallback((c: string) => setSelectedCategory(c), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  const addToOrder = useCallback((item: MenuItem) => {
    console.log('Adding item to order:', item);

    setCurrentOrder((prev) => {
      // Check if we already have this item in the current order
      // We want to increase quantity regardless of sentToKitchen status
      const existingPendingIndex = prev.findIndex((p) => p.id === item.id && !p.sentToKitchen);

      if (existingPendingIndex !== -1) {
        // Update quantity of existing pending item
        const updated = [...prev];
        updated[existingPendingIndex] = {
          ...updated[existingPendingIndex],
          quantity: updated[existingPendingIndex].quantity + 1
        };
        console.log('Updated existing pending item, new order:', updated);
        return updated;
      }

      // Check if this item was already sent to kitchen
      const existingSentIndex = prev.findIndex((p) => p.id === item.id && p.sentToKitchen);

      if (existingSentIndex !== -1) {
        // Item exists but was sent to kitchen
        // Add the additional quantity to the sent item
        const updated = [...prev];
        updated[existingSentIndex] = {
          ...updated[existingSentIndex],
          quantity: updated[existingSentIndex].quantity + 1
        };
        console.log('Increased quantity of sent item, new order:', updated);
        return updated;
      }

      // Add new item
      const orderItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        sentToKitchen: false,
        department: item.department
      };
      const newOrder = [...prev, orderItem];
      console.log('Added new item, new order:', newOrder);
      return newOrder;
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number, sentToKitchen?: boolean) => {
    setCurrentOrder((prev) =>
      prev
        .map((it) => (it.id === id && it.sentToKitchen === sentToKitchen ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0)
    );
  }, []);

  const removeFromOrder = useCallback((id: string, sentToKitchen?: boolean) => {
    setCurrentOrder((prev) => prev.filter((it) => !(it.id === id && it.sentToKitchen === sentToKitchen)));
  }, []);

  const clearOrder = useCallback(() => {
    setCurrentOrder([]);
    setSearchQuery("");
    // Don't clear the selected table when holding an order
  }, []);

  const generateKOTContent = useCallback(
    (items: CartItem[], isAdditional = false, department?: string) => {
      const now = new Date();
      const orderNumber = `KOT-${Date.now()}`;

      // Get paper size and format from context
      const paperSize = kotConfig.paperSize || "80mm";
      const formatType = kotConfig.formatType || "detailed";

      // Adjust styling based on paper size
      let fontSize = "12px";
      let padding = "8px";
      let maxWidth = "80mm";

      if (paperSize === "58mm") {
        fontSize = "10px";
        padding = "5px";
        maxWidth = "58mm";
      } else if (paperSize === "112mm") {
        fontSize = "14px";
        padding = "12px";
        maxWidth = "112mm";
      }

      // Generate content based on format type
      let content = "";

      if (formatType === "compact") {
        // Compact format
        content = `<!doctype html><html><head><meta charset="utf-8"><title>${orderNumber}</title><style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize};
            padding: ${padding};
            max-width: ${maxWidth};
            margin: 0 auto;
            box-sizing: border-box;
          }
          .h {
            text-align: center;
            font-weight: 700;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          @media print {
            @page {
              size: ${maxWidth} auto;
              margin: 0;
            }
            body {
              width: ${maxWidth};
              max-width: ${maxWidth};
              padding: ${padding};
              margin: 0;
            }
          }
        </style></head><body>` +
          `<div class="h">KOT</div>` +
          (department ? `<div style="text-align:center">[${department}]</div>` : "") +
          (isAdditional ? `<div style="text-align:center;font-weight:700;margin:5px 0">*** ADDITIONAL ***</div>` : "") +
          `<div>${now.toLocaleString()}</div>` +
          `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
          `<hr/>` +
          items
            .map((it) => `<div>${it.name} x ${it.quantity}</div>`)
            .join("") +
          `<hr/><div style="text-align:center">Generated by POS</div></body></html>`;
      } else if (formatType === "grouped") {
        // Grouped by department format
        const groupedItems: Record<string, CartItem[]> = {};
        items.forEach(item => {
          const dept = item.department || "General";
          if (!groupedItems[dept]) {
            groupedItems[dept] = [];
          }
          groupedItems[dept].push(item);
        });

        content = `<!doctype html><html><head><meta charset="utf-8"><title>${orderNumber}</title><style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize};
            padding: ${padding};
            max-width: ${maxWidth};
            margin: 0 auto;
            box-sizing: border-box;
          }
          .h {
            text-align: center;
            font-weight: 700;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          @media print {
            @page {
              size: ${maxWidth} auto;
              margin: 0;
            }
            body {
              width: ${maxWidth};
              max-width: ${maxWidth};
              padding: ${padding};
              margin: 0;
            }
          }
        </style></head><body>` +
          `<div class="h">KITCHEN ORDER TICKET</div>` +
          (isAdditional ? `<div style="text-align:center;font-weight:700;margin:5px 0">*** ADDITIONAL ITEMS ***</div>` : "") +
          `<div>Date: ${now.toLocaleString()}</div>` +
          `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
          `<hr/>`;

        Object.entries(groupedItems).forEach(([dept, deptItems]) => {
          content += `<div style="font-weight:700;margin-top:10px">[${dept}]</div>`;
          deptItems.forEach(it => {
            content += `<div><strong>${it.name}</strong> x ${it.quantity}</div>`;
          });
        });

        content += `<hr/><div style="text-align:center">Generated by Restaurant POS</div></body></html>`;
      } else {
        // Detailed format (default)
        content = `<!doctype html><html><head><meta charset="utf-8"><title>${orderNumber}</title><style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize};
            padding: ${padding};
            max-width: ${maxWidth};
            margin: 0 auto;
            box-sizing: border-box;
          }
          .h {
            text-align: center;
            font-weight: 700;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          @media print {
            @page {
              size: ${maxWidth} auto;
              margin: 0;
            }
            body {
              width: ${maxWidth};
              max-width: ${maxWidth};
              padding: ${padding};
              margin: 0;
            }
          }
        </style></head><body>` +
          `<div class="h">KITCHEN ORDER TICKET</div>` +
          (department ? `<div style="text-align:center">[${department}]</div>` : "") +
          (isAdditional ? `<div style="text-align:center;font-weight:700;margin:5px 0">*** ADDITIONAL ITEMS ***</div>` : "") +
          `<div>Date: ${now.toLocaleString()}</div>` +
          `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
          `<hr/>` +
          items
            .map((it) => `<div><strong>${it.name}</strong> x ${it.quantity} <span style="float:right">[${it.department || "General"}]</span></div>`)
            .join("") +
          `<hr/><div style="text-align:center">Generated by Restaurant POS</div></body></html>`;
      }

      return content;
    },
    [kotConfig, selectedTableData?.name]
  );

  const printKOT = useCallback(
    async (items: CartItem[], isAdditional = false) => {
      const popup = window.open("", "_blank", "width=400,height=600");
      if (!popup) return;

      // Get paper size from context
      const paperSize = kotConfig.paperSize || "80mm";

      // Set width based on paper size
      let windowWidth = 400;
      if (paperSize === "58mm") {
        windowWidth = 300;
      } else if (paperSize === "112mm") {
        windowWidth = 500;
      }

      // Resize window to match paper size
      popup.resizeTo(windowWidth, 600);

      popup.document.write(generateKOTContent(items, isAdditional));
      popup.document.close();

      // Add print-specific styling
      const printStyle = popup.document.createElement('style');
      printStyle.innerHTML = `
        @media print {
          @page {
            size: ${paperSize === "58mm" ? "58mm" : paperSize === "112mm" ? "112mm" : "80mm"} auto;
            margin: 0;
          }
          body {
            width: ${paperSize === "58mm" ? "58mm" : paperSize === "112mm" ? "112mm" : "80mm"};
            margin: 0;
            padding: 0;
          }
        }
      `;
      popup.document.head.appendChild(printStyle);

      setTimeout(() => {
        popup.print();
        popup.close();
      }, 200);
    },
    [generateKOTContent, kotConfig]
  );

  const generateBillContent = useCallback(() => {
    const now = new Date();
    const billNumber = `BILL-${Date.now()}`;

    // Get all items from current order and existing table order
    const allItems = [...getAllCombinedItems()];
    if (existingTableOrder) {
      allItems.push(...existingTableOrder.items);
    }

    const sub = allItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const t = sub * 0.05;
    const tot = sub + t;

    // Get paper size and format from context
    const paperSize = billConfig.paperSize || "80mm";
    const formatType = billConfig.formatType || "standard";

    // Adjust styling based on paper size
    let fontSize = "12px";
    let padding = "8px";
    let maxWidth = "80mm";

    if (paperSize === "58mm") {
      fontSize = "10px";
      padding = "5px";
      maxWidth = "58mm";
    } else if (paperSize === "112mm") {
      fontSize = "14px";
      padding = "12px";
      maxWidth = "112mm";
    }

    let content = "";

    if (formatType === "compact") {
      // Compact bill format
      content = `<!doctype html><html><head><meta charset="utf-8"><title>${billNumber}</title><style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${fontSize};
          padding: ${padding};
          max-width: ${maxWidth};
          margin: 0 auto;
          box-sizing: border-box;
        }
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        @media print {
          @page {
            size: ${maxWidth} auto;
            margin: 0;
          }
          body {
            width: ${maxWidth};
            max-width: ${maxWidth};
            padding: ${padding};
            margin: 0;
          }
        }
      </style></head><body>` +
        `<div style="text-align:center;font-weight:700">TAX INVOICE</div>` +
        `<div>Bill: ${billNumber}</div><div>${now.toLocaleString()}</div>` +
        `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
        `<hr/>` +
        allItems.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) ₹${(i.quantity * i.price).toFixed(2)}</div>`).join("") +
        `<hr/>` +
        `<div>Subtotal: ₹${sub.toFixed(2)}</div>` +
        `<div>GST (5%): ₹${t.toFixed(2)}</div>` +
        `<div style="font-weight:700">TOTAL: ₹${tot.toFixed(2)}</div>` +
        `</body></html>`;
    } else if (formatType === "detailed") {
      // Detailed bill format
      content = `<!doctype html><html><head><meta charset="utf-8"><title>${billNumber}</title><style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${fontSize};
          padding: ${padding};
          max-width: ${maxWidth};
          margin: 0 auto;
          box-sizing: border-box;
        }
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        @media print {
          @page {
            size: ${maxWidth} auto;
            margin: 0;
          }
          body {
            width: ${maxWidth};
            max-width: ${maxWidth};
            padding: ${padding};
            margin: 0;
          }
        }
      </style></head><body>` +
        `<div style="text-align:center;font-weight:700">RESTAURANT POS - TAX INVOICE</div>` +
        `<div>Bill No: ${billNumber}</div><div>Date: ${now.toLocaleString()}</div>` +
        `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
        `<hr/>` +
        allItems.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) <span style="float:right">₹${(i.quantity * i.price).toFixed(2)}</span></div>`).join("") +
        `<hr/>` +
        `<div>Subtotal <span style="float:right">₹${sub.toFixed(2)}</span></div>` +
        `<div>GST (5%) <span style="float:right">₹${t.toFixed(2)}</span></div>` +
        `<div style="font-weight:700">TOTAL <span style="float:right">₹${tot.toFixed(2)}</span></div>` +
        `</body></html>`;
    } else {
      // Standard bill format (default)
      content = `<!doctype html><html><head><meta charset="utf-8"><title>${billNumber}</title><style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${fontSize};
          padding: ${padding};
          max-width: ${maxWidth};
          margin: 0 auto;
          box-sizing: border-box;
        }
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        @media print {
          @page {
            size: ${maxWidth} auto;
            margin: 0;
          }
          body {
            width: ${maxWidth};
            max-width: ${maxWidth};
            padding: ${padding};
            margin: 0;
          }
        }
      </style></head><body>` +
        `<div style="text-align:center;font-weight:700">RESTAURANT POS - TAX INVOICE</div>` +
        `<div>Bill No: ${billNumber}</div><div>Date: ${now.toLocaleString()}</div>` +
        `<div>Table: ${selectedTableData?.name || 'N/A'}</div>` +
        `<hr/>` +
        allItems.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) <span style="float:right">₹${(i.quantity * i.price).toFixed(2)}</span></div>`).join("") +
        `<hr/>` +
        `<div>Subtotal <span style="float:right">₹${sub.toFixed(2)}</span></div>` +
        `<div>GST (5%) <span style="float:right">₹${t.toFixed(2)}</span></div>` +
        `<div style="font-weight:700">TOTAL <span style="float:right">₹${tot.toFixed(2)}</span></div>` +
        `</body></html>`;
    }

    return content;
  }, [getAllCombinedItems, billConfig, selectedTableData?.name, existingTableOrder]);

  const printBill = useCallback(() => {
    const popup = window.open("", "_blank", "width=400,height=600");
    if (!popup) return;

    // Get paper size from context
    const paperSize = billConfig.paperSize || "80mm";

    // Set width based on paper size
    let windowWidth = 400;
    if (paperSize === "58mm") {
      windowWidth = 300;
    } else if (paperSize === "112mm") {
      windowWidth = 500;
    }

    // Resize window to match paper size
    popup.resizeTo(windowWidth, 600);

    popup.document.write(generateBillContent());
    popup.document.close();

    // Add print-specific styling
    const printStyle = popup.document.createElement('style');
    printStyle.innerHTML = `
      @media print {
        @page {
          size: ${paperSize === "58mm" ? "58mm" : paperSize === "112mm" ? "112mm" : "80mm"} auto;
          margin: 0;
        }
        body {
          width: ${paperSize === "58mm" ? "58mm" : paperSize === "112mm" ? "112mm" : "80mm"};
          margin: 0;
          padding: 0;
        }
      }
    `;
    popup.document.head.appendChild(printStyle);

    setTimeout(() => {
      popup.print();
      popup.close();
    }, 200);
  }, [generateBillContent, billConfig]);

  const placeOrder = useCallback(async () => {
    const pending = getPendingItems();
    if (!pending.length) return;

    // Generate KOT when placing order
    if (kotConfig.printByDepartment !== undefined) await printKOT(pending);

    // Add items to table order in context
    if (selectedTable && selectedTableData) {
      await addItemsToTable(selectedTable, selectedTableData.name, pending);

      // Mark items as sent to kitchen
      await markItemsAsSent(selectedTable);

      // Reload the table order to show all items including sent ones
      const order = getTableOrder(selectedTable);
      if (order && order.items) {
        const cartItems: CartItem[] = order.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sentToKitchen: item.sentToKitchen || false,
          department: item.department
        }));
        setCurrentOrder(cartItems);
      }

      // Show dialog asking whether to generate bill or hold
      setShowHoldDialog(true);
    }
  }, [getPendingItems, kotConfig, printKOT, selectedTable, selectedTableData, addItemsToTable, markItemsAsSent, getTableOrder]);



  const holdOrder = useCallback(() => {
    setShowHoldDialog(false);
    // Order is already held in the backend, just close the dialog
  }, []);

  const generateBillFromHold = useCallback(() => {
    setShowHoldDialog(false);
    setShowBillDialog(true);
  }, []);

  const generateBill = useCallback(async () => {
    if (!selectedTable || !selectedTableData) return;

    // Get all items from the table order
    const order = getTableOrder(selectedTable);
    if (!order || !order.items || order.items.length === 0) {
      alert("No items in order to generate bill.");
      return;
    }

    const allItems = order.items;
    const sub = allItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const t = sub * 0.05;
    const tot = sub + t;

    const invoice = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now()}`,
      orderType: "dine-in",
      tableName: selectedTableData.name,
      items: allItems,
      subtotal: sub,
      tax: t,
      total: tot,
      timestamp: new Date(),
    } as any;

    await addInvoice(invoice);

    // Complete the table order (clears order and makes table available)
    await completeTableOrder(selectedTable);

    // Clear local state and localStorage
    setCurrentOrder([]);
    setSelectedTable("");
    localStorage.removeItem('dineInSelectedTable');
    setShowBillDialog(false);

    alert("Bill generated successfully! Table is now available.");
  }, [selectedTable, selectedTableData, getTableOrder, addInvoice, completeTableOrder]);







  // Determine if cart should be visible
  const isCartVisible = selectedTable || currentOrder.length > 0;

  return (
    <>
      {/* Main Content Area - accounts for cart width, no gap */}
      <div
        className="h-full overflow-y-auto"
        style={{
          width: isCartVisible ? 'calc(100% - 420px)' : '100%',
          transition: 'width 0.3s ease',
          marginRight: 0,
          paddingRight: 0
        }}
      >
        <div className="p-6">
          {!selectedTable && (
            <div>
              <div className="mb-6"><h2 className="text-gray-900 mb-2">Select Table</h2><p className="text-muted-foreground">Choose a table for dine-in order</p></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table: Table) => (
                  <Card
                    key={table.id}
                    onClick={() => handleTableSelect(table.id)}
                    className={`cursor-pointer ${table.status === "available"
                      ? "bg-green-100 border-green-300"
                      : "bg-red-100 border-red-300"
                      }`}
                  >
                    <CardHeader className="p-4">
                      <div className="text-center space-y-3">
                        <div>
                          <p className="text-gray-900 mb-1">Table {table.name}</p>
                          <Badge
                            variant="outline"
                            className={
                              table.status === "available"
                                ? "bg-green-200 text-green-800 border-green-300"
                                : "bg-red-200 text-red-800 border-red-300"
                            }
                          >
                            {table.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">{table.seats} seats • {table.category}</div>
                        {table.status === "occupied" && getTableOrder(table.id) && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-center gap-1 text-orange-600">
                              <Clock className="size-3" />
                              <span className="text-sm font-semibold">{formatTimeAgo(getTableOrder(table.id)!.startTime)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Started: {formatDateTime(getTableOrder(table.id)!.startTime)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getTableOrder(table.id)?.items.length || 0} items
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(selectedTable) && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-gray-900 mb-2">{selectedTableData ? `Table ${selectedTableData.name}` : "Dine-In Order"}</h2>
                  <p className="text-muted-foreground">Select items to add to order</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTable("");
                    setCurrentOrder([]);
                    localStorage.removeItem('dineInSelectedTable');
                  }}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back to Tables
                </Button>
              </div>

              <div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input value={searchQuery} onChange={handleSearchChange} placeholder="Search menu items..." className="pl-10 w-full" /></div></div>

              <div className="flex gap-2 mb-6 flex-wrap">{categories.map((c) => (<Button key={c} variant={selectedCategory === c ? "default" : "outline"} onClick={() => handleCategorySelect(c)}>{c}</Button>))}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.length === 0 && (<div className="col-span-full text-center py-12 text-gray-500"><Search className="size-12 mx-auto mb-4 opacity-20" /><p>No items found</p></div>)}

                {filteredItems.map((item) => (
                  <Card key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <CardHeader className="p-4"><div className="space-y-2"><div className="flex justify-between items-start"><div><CardTitle className="text-lg font-semibold">{item.name}</CardTitle><p className="text-sm text-gray-500">{item.category}</p></div><p className="text-lg font-bold text-purple-600">₹{item.price}</p></div><p className="text-sm text-gray-500">{item.description}</p></div></CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Button
                        onClick={() => {
                          console.log('Button clicked for item:', item);
                          addToOrder(item);
                        }}
                        variant="default"
                        type="button"
                        className="w-full !bg-purple-600 hover:!bg-purple-700 !text-white border-0"
                        style={{ backgroundColor: '#9333ea', color: 'white', cursor: 'pointer' }}
                      >
                        <Plus className="size-4 mr-2" /> Add to Order
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cart Sidebar - Fixed at viewport level, same height as side nav */}
      {isCartVisible && (
        <aside
          className="w-[420px] bg-white flex flex-col shadow-2xl"
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            width: '420px',
            height: '100vh',
            backgroundColor: '#ffffff',
            zIndex: 30,
            borderLeft: '2px solid #e5e7eb'
          }}
        >
          {/* Cart Header - Fixed, no scroll */}
          <header className="px-8 py-5 border-b-2 flex-shrink-0 bg-white pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedTableData ? `Table ${selectedTableData.name}` : "Current Order"}
                </h3>
                {selectedTable && getTableOrder(selectedTable) && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="size-3 text-gray-500" />
                    <p className="text-xs text-gray-500">
                      Occupied: {formatTimeAgo(getTableOrder(selectedTable)!.startTime)}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {getAllCombinedItems().length} {getAllCombinedItems().length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div>
                {getAllCombinedItems().length > 0 ? (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="size-6 text-purple-600" />
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                      {getAllCombinedItems().length}
                    </span>
                  </div>
                ) : (
                  <ShoppingCart className="size-6 text-gray-400" />
                )}
              </div>
            </div>
          </header>

          {/* Cart Items - Scrollable section only */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowY: 'auto' }}>
            <div className="px-8 py-5 space-y-4">
              {currentOrder.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <ShoppingCart className="size-16 mx-auto mb-4 text-gray-300" />
                  <div>No items in order</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show all items - both pending and sent to kitchen */}
                  {currentOrder.map((it, idx) => (
                    <div
                      key={`${it.id}-${idx}`}
                      className={`flex items-start justify-between p-5 border-2 rounded-lg transition-colors ${it.sentToKitchen
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold text-lg">{it.name}</div>
                          {it.sentToKitchen && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Sent to Kitchen
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(it.id, -1, it.sentToKitchen)}
                              className="h-9 w-18 text-base font-bold"
                              disabled={it.sentToKitchen}
                            >
                              -
                            </Button>
                            <div className="w-12 text-center font-semibold text-lg">{it.quantity}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(it.id, 1, it.sentToKitchen)}
                              className="h-9 w-18 text-base font-bold"
                            >
                              +
                            </Button>
                          </div>
                          <div className="ml-auto text-purple-600 font-bold text-lg">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromOrder(it.id, it.sentToKitchen)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                          disabled={it.sentToKitchen}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Footer - Fixed, no scroll */}
          <div className="border-t-2 px-8 py-5 flex-shrink-0 bg-white">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-purple-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 mb-6">
              <Button
                onClick={placeOrder}
                disabled={getPendingItems().length === 0}
                className="w-full"
              >
                <Printer className="mr-2" />
                Place Order
              </Button>

              {selectedTable && getTableOrder(selectedTable) && getTableOrder(selectedTable)!.items.length > 0 && (
                <Button
                  onClick={() => setShowBillDialog(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Printer className="mr-2" />
                  Generate Bill
                </Button>
              )}
            </div>
          </div>
        </aside>
      )}



      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Placed</DialogTitle>
            <DialogDescription>What would you like to do with this order?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center">KOT has been sent to kitchen. Would you like to generate the bill now or hold the order?</p>
            <div className="flex gap-2">
              <Button
                onClick={holdOrder}
                variant="outline"
                className="flex-1"
              >
                Hold Order
              </Button>
              <Button
                onClick={generateBillFromHold}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Generate Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>Confirm bill generation for {selectedTableData?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTable && getTableOrder(selectedTable) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="size-4" />
                  <span>Order Time: {formatDateTime(getTableOrder(selectedTable)!.startTime)}</span>
                </div>
                <div className="text-xs text-gray-500 ml-6">
                  Duration: {formatTimeAgo(getTableOrder(selectedTable)!.startTime)}
                </div>
              </div>
            )}
            <div className="flex justify-between mb-4">
              <span>Total Amount:</span>
              <span className="text-purple-600 font-bold">₹{total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Bill will be generated at: {formatDateTime(new Date())}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  printBill();
                  generateBill();
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Printer className="mr-2" /> Print & Complete
              </Button>
              <Button
                onClick={generateBill}
                variant="outline"
                className="flex-1"
              >
                Complete Without Printing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, ShoppingCart, Trash2, Printer, Clock, Search, RotateCcw } from "lucide-react";
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
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
}

export const TakeawayPage: React.FC = () => {
  const {
    tables,
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
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<PendingOrder | null>(null);

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

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function when component unmounts
      console.log("TakeawayPage unmounted");
    };
  }, []);

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
    const map = new Map<string, CartItem>();
    currentOrder.forEach((it) => {
      const existing = map.get(it.id);
      if (existing) existing.quantity += it.quantity;
      else map.set(it.id, { ...it });
    });
    return Array.from(map.values());
  }, [currentOrder]);

  const subtotal = useMemo(() => getAllCombinedItems().reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0), [getAllCombinedItems]);
  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleCategorySelect = useCallback((c: string) => setSelectedCategory(c), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  const addToOrder = useCallback((item: MenuItem) => {
    console.log('Adding item to order:', item);
    
    setCurrentOrder((prev) => {
      const existing = prev.find((p) => p.id === item.id && !p.sentToKitchen);
      if (existing) {
        const updated = prev.map((p) => (p.id === item.id && !p.sentToKitchen ? { ...p, quantity: p.quantity + 1 } : p));
        console.log('Updated existing item, new order:', updated);
        return updated;
      }
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
          `<div>Takeaway</div>` +
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
          `<div>Type: Takeaway</div>` +
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
          `<div>Type: Takeaway</div>` +
          `<hr/>` +
          items
            .map((it) => `<div><strong>${it.name}</strong> x ${it.quantity} <span style="float:right">[${it.department || "General"}]</span></div>`)
            .join("") +
          `<hr/><div style="text-align:center">Generated by Restaurant POS</div></body></html>`;
      }
      
      return content;
    },
    [kotConfig]
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
    const items = getAllCombinedItems();
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
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
        `<div>Type: Takeaway</div>` +
        `<hr/>` +
        items.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) ₹${(i.quantity * i.price).toFixed(2)}</div>`).join("") +
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
        `<div>Type: Takeaway</div>` +
        `<hr/>` +
        items.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) <span style="float:right">₹${(i.quantity * i.price).toFixed(2)}</span></div>`).join("") +
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
        `<div>Type: Takeaway</div>` +
        `<hr/>` +
        items.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) <span style="float:right">₹${(i.quantity * i.price).toFixed(2)}</span></div>`).join("") +
        `<hr/>` +
        `<div>Subtotal <span style="float:right">₹${sub.toFixed(2)}</span></div>` +
        `<div>GST (5%) <span style="float:right">₹${t.toFixed(2)}</span></div>` +
        `<div style="font-weight:700">TOTAL <span style="float:right">₹${tot.toFixed(2)}</span></div>` +
        `</body></html>`;
    }
    
    return content;
  }, [getAllCombinedItems, billConfig]);

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
    
    // Generate invoice number for pending order
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Store the order as pending (without generating invoice yet)
    const newPendingOrder: PendingOrder = {
      id: `PENDING-${Date.now()}`,
      invoiceNumber,
      items: [...currentOrder],
      subtotal,
      tax,
      total,
      timestamp: new Date()
    };
    
    setPendingOrders(prev => [...prev, newPendingOrder]);
    
    // Show dialog to ask user whether to generate bill or hold
    setShowHoldDialog(true);
  }, [getPendingItems, kotConfig, printKOT, currentOrder, subtotal, tax, total]);

  const holdOrder = useCallback(() => {
    clearOrder();
    setShowHoldDialog(false);
    alert("Order held. You can recall it later using the Recall button.");
  }, [clearOrder]);

  const generateBillNow = useCallback(async () => {
    if (pendingOrders.length === 0) return;
    
    // Get the most recent pending order
    const mostRecentOrder = pendingOrders[pendingOrders.length - 1];
    
    const invoice = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now()}`,
      orderType: "takeaway",
      items: mostRecentOrder.items,
      subtotal: mostRecentOrder.subtotal,
      tax: mostRecentOrder.tax,
      total: mostRecentOrder.total,
      timestamp: new Date(),
    } as any;

    await addInvoice(invoice);
    
    // Remove the pending order
    setPendingOrders(prev => prev.filter(order => order.id !== mostRecentOrder.id));
    clearOrder();
    setShowHoldDialog(false);
    
    alert("Bill generated and order completed.");
  }, [pendingOrders, addInvoice, clearOrder]);

  const completeBill = useCallback(async () => {
    if (!selectedPendingOrder) return;
    
    const invoice = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now()}`,
      orderType: "takeaway",
      items: selectedPendingOrder.items,
      subtotal: selectedPendingOrder.subtotal,
      tax: selectedPendingOrder.tax,
      total: selectedPendingOrder.total,
      timestamp: new Date(),
    } as any;

    await addInvoice(invoice);
    
    // Remove the pending order from the list
    setPendingOrders(prev => prev.filter(order => order.id !== selectedPendingOrder.id));
    
    // Clear the selected pending order and current order
    setSelectedPendingOrder(null);
    setCurrentOrder([]);
    setShowBillDialog(false);
    
    alert("Bill generated and order completed.");
  }, [selectedPendingOrder, addInvoice]);

  const recallOrder = useCallback((order: PendingOrder) => {
    setCurrentOrder([...order.items]);
    setSelectedPendingOrder(order);
    setShowRecallDialog(false);
    alert(`Order ${order.invoiceNumber} recalled. You can now modify or generate a bill for this order.`);
  }, []);

  const addMoreItemsToRecalledOrder = useCallback(() => {
    if (!selectedPendingOrder) return;
    
    // Merge current order with recalled order
    const mergedOrder = [...selectedPendingOrder.items, ...currentOrder];
    
    // Update the selected pending order with merged items
    const updatedOrder = {
      ...selectedPendingOrder,
      items: mergedOrder,
      subtotal: mergedOrder.reduce((s, i) => s + i.price * i.quantity, 0),
      tax: mergedOrder.reduce((s, i) => s + i.price * i.quantity, 0) * 0.05,
      total: mergedOrder.reduce((s, i) => s + i.price * i.quantity, 0) * 1.05
    };
    
    setSelectedPendingOrder(updatedOrder);
    setCurrentOrder([]);
    
    // Update the pending orders list
    setPendingOrders(prev => prev.map(order => 
      order.id === selectedPendingOrder.id ? updatedOrder : order
    ));
    
    alert("Items added to recalled order.");
  }, [selectedPendingOrder, currentOrder]);

  // Determine if cart should be visible
  const isCartVisible = currentOrder.length > 0 || selectedPendingOrder !== null;

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
          <div className="mb-6">
            <h2 className="text-gray-900 mb-2">Takeaway Order</h2>
            <p className="text-muted-foreground">Select items for takeaway order</p>
          </div>

          {/* Recall Button - Positioned properly in main content area */}
          {pendingOrders.length > 0 && (
            <div className="mb-4">
              <Button 
                onClick={() => setShowRecallDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                style={{
                  background: 'linear-gradient(to right, #9333ea, #ec4899)',
                }}
              >
                <RotateCcw className="size-4 mr-2" />
                Recall Orders ({pendingOrders.length})
              </Button>
            </div>
          )}

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
                  {selectedPendingOrder ? `Recalled Order: ${selectedPendingOrder.invoiceNumber}` : "Current Order"}
                </h3>
                <p className="text-sm text-gray-500">
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
              {currentOrder.length === 0 && (!selectedPendingOrder || selectedPendingOrder.items.length === 0) ? (
                <div className="text-center py-10 text-gray-500">
                  <ShoppingCart className="size-16 mx-auto mb-4 text-gray-300" />
                  <div>No items in order</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show recalled order items if any */}
                  {selectedPendingOrder && selectedPendingOrder.items.map((it, idx) => (
                    <div key={`recalled-${it.id}-${idx}`} className="flex items-start justify-between p-5 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg mb-3">{it.name} (Recalled)</div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 text-center font-semibold text-lg">{it.quantity}</div>
                          </div>
                          <div className="ml-auto text-purple-600 font-bold text-lg">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show current order items */}
                  {getPendingItems().map((it, idx) => (
                    <div key={`${it.id}-${idx}`} className="flex items-start justify-between p-5 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg mb-3">{it.name}</div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => updateQuantity(it.id, -1, false)} className="h-9 w-18 text-base font-bold">
                              -
                            </Button>
                            <div className="w-12 text-center font-semibold text-lg">{it.quantity}</div>
                            <Button variant="outline" size="sm" onClick={() => updateQuantity(it.id, 1, false)} className="h-9 w-18 text-base font-bold">
                              +
                            </Button>
                          </div>
                          <div className="ml-auto text-purple-600 font-bold text-lg">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="ghost" size="sm" onClick={() => removeFromOrder(it.id, false)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9">
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
                <span>₹{
                  selectedPendingOrder 
                    ? (selectedPendingOrder.subtotal + subtotal).toFixed(2) 
                    : subtotal.toFixed(2)
                }</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (5%)</span>
                <span>₹{
                  selectedPendingOrder 
                    ? ((selectedPendingOrder.subtotal + subtotal) * 0.05).toFixed(2) 
                    : tax.toFixed(2)
                }</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-purple-600">₹{
                  selectedPendingOrder 
                    ? ((selectedPendingOrder.subtotal + subtotal) * 1.05).toFixed(2) 
                    : total.toFixed(2)
                }</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 mb-6">
              {selectedPendingOrder && currentOrder.length > 0 ? (
                <Button 
                  onClick={addMoreItemsToRecalledOrder} 
                  className="w-full"
                >
                  Add Items to Recalled Order
                </Button>
              ) : (
                <Button 
                  onClick={placeOrder} 
                  disabled={getPendingItems().length === 0} 
                  className="w-full"
                >
                  <Printer className="mr-2" /> 
                  Place Order
                </Button>
              )}
              
              {selectedPendingOrder && (
                <Button onClick={() => setShowBillDialog(true)} variant="outline" className="w-full">
                  Generate Bill
                </Button>
              )}
              
              {selectedPendingOrder && (
                <Button 
                  onClick={() => {
                    setSelectedPendingOrder(null);
                    setCurrentOrder([]);
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  Start New Order
                </Button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Recall Orders Dialog */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recall Orders</DialogTitle>
            <DialogDescription>Select an order to recall</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-60 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <p className="text-center text-gray-500">No pending orders</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => recallOrder(order)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{order.invoiceNumber}</span>
                      <span className="text-sm text-gray-500">
                        ₹{order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} items • {order.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hold or Generate Bill Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Placed</DialogTitle>
            <DialogDescription>What would you like to do with this order?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center">KOT has been generated. Would you like to generate the bill now or hold the order?</p>
            <div className="flex gap-2">
              <Button 
                onClick={holdOrder}
                variant="outline"
                className="flex-1"
              >
                Hold Order
              </Button>
              <Button 
                onClick={generateBillNow}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Generate Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>Would you like to print the bill?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between mb-4">
              <span>Total Amount:</span>
              <span className="text-purple-600">₹{
                selectedPendingOrder 
                  ? selectedPendingOrder.total.toFixed(2) 
                  : '0.00'
              }</span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => { 
                  printBill(); 
                  completeBill(); 
                }} 
                className="flex-1"
              > 
                <Printer className="mr-2" /> Print Bill
              </Button>
              <Button onClick={completeBill} variant="outline" className="flex-1">
                Complete Without Printing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
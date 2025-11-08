import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, Minus, ShoppingCart, Trash2, Printer, Clock, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRestaurant } from "../contexts/RestaurantContext";
import * as api from "../services/api";
import { MenuItem, Table, OrderItem } from "../types";

type OrderType = "dine-in" | "takeaway";

interface Props {
  defaultOrderType?: OrderType;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sentToKitchen?: boolean;
  department?: string;
}

export const OrdersPage: React.FC<Props> = ({ defaultOrderType = "dine-in" }) => {
  const {
    tables,
    addItemsToTable,
    getTableOrder,
    completeTableOrder,
    markItemsAsSent,
    addInvoice,
    kotConfig,
  } = useRestaurant();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<OrderType | null>(defaultOrderType);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);

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

  const selectedTableData = useMemo(() => tables.find((t: Table) => t.id === selectedTable), [tables, selectedTable]);
  const existingTableOrder = useMemo(() => (selectedTable ? getTableOrder(selectedTable) : undefined), [selectedTable, getTableOrder]);

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

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    setCurrentOrder([]);
    setSelectedTable("");
    setSearchQuery("");
  }, []);

  const handleTableSelect = useCallback((tableId: string) => setSelectedTable(tableId), []);
  const handleCategorySelect = useCallback((c: string) => setSelectedCategory(c), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  const addToOrder = useCallback((item: MenuItem) => {
    setCurrentOrder((prev) => {
      const existing = prev.find((p) => p.id === item.id && !p.sentToKitchen);
      if (existing) return prev.map((p) => (p.id === item.id && !p.sentToKitchen ? { ...p, quantity: p.quantity + 1 } : p));
      const orderItem: CartItem = { ...item, quantity: 1, sentToKitchen: false };
      return [...prev, orderItem];
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
    setOrderType(null);
    setSelectedTable("");
    setSearchQuery("");
  }, []);

  const generateKOTContent = useCallback(
    (items: CartItem[], isAdditional = false, department?: string) => {
      const now = new Date();
      const orderNumber = `KOT-${Date.now()}`;
      return `<!doctype html><html><head><meta charset="utf-8"><title>${orderNumber}</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:8px} .h{text-align:center;font-weight:700}</style></head><body>` +
        `<div class="h">KITCHEN ORDER TICKET</div>` +
        (department ? `<div style="text-align:center">[${department}]</div>` : "") +
        (isAdditional ? `<div style="text-align:center;font-weight:700;margin:5px 0">*** ADDITIONAL ITEMS ***</div>` : "") +
        `<div>Date: ${now.toLocaleString()}</div>` +
        `<div>Type: ${orderType}</div>` +
        (orderType === "dine-in" && selectedTableData ? `<div>Table: ${selectedTableData.name}</div>` : "") +
        `<hr/>` +
        items
          .map((it) => `<div><strong>${it.name}</strong> x ${it.quantity} <span style="float:right">[${it.department}]</span></div>`)
          .join("") +
        `<hr/><div style="text-align:center">Generated by Restaurant POS</div></body></html>`;
    },
    [orderType, selectedTableData]
  );

  const printKOT = useCallback(
    async (items: CartItem[], isAdditional = false) => {
      const popup = window.open("", "_blank", "width=300,height=600");
      if (!popup) return;
      popup.document.write(generateKOTContent(items, isAdditional));
      popup.document.close();
      setTimeout(() => {
        popup.print();
        popup.close();
      }, 200);
    },
    [generateKOTContent]
  );

  const generateBillContent = useCallback(() => {
    const now = new Date();
    const billNumber = `BILL-${Date.now()}`;
    const items = getAllCombinedItems();
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const t = sub * 0.05;
    const tot = sub + t;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${billNumber}</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:8px}</style></head><body>` +
      `<div style="text-align:center;font-weight:700">RESTAURANT POS - TAX INVOICE</div>` +
      `<div>Bill No: ${billNumber}</div><div>Date: ${now.toLocaleString()}</div>` +
      `<hr/>` +
      items.map(i => `<div>${i.name} (${i.quantity} x ₹${i.price.toFixed(2)}) <span style="float:right">₹${(i.quantity * i.price).toFixed(2)}</span></div>`).join("") +
      `<hr/>` +
      `<div>Subtotal <span style="float:right">₹${sub.toFixed(2)}</span></div>` +
      `<div>GST (5%) <span style="float:right">₹${t.toFixed(2)}</span></div>` +
      `<div style="font-weight:700">TOTAL <span style="float:right">₹${tot.toFixed(2)}</span></div>` +
      `</body></html>`;
  }, [getAllCombinedItems]);

  const printBill = useCallback(() => {
    const popup = window.open("", "_blank", "width=300,height=600");
    if (!popup) return;
    popup.document.write(generateBillContent());
    popup.document.close();
    setTimeout(() => {
      popup.print();
      popup.close();
    }, 200);
  }, [generateBillContent]);

  const placeOrder = useCallback(async () => {
    const pending = getPendingItems();
    if (!pending.length) return;

    const isAdditional = !!existingTableOrder;

    if (orderType === "dine-in" && selectedTable) {
      await addItemsToTable(selectedTable, pending);
      if (kotConfig?.enabled) await printKOT(pending, isAdditional);
      setCurrentOrder((prev) => prev.map((it) => (pending.some((p) => p.id === it.id && !p.sentToKitchen) ? { ...it, sentToKitchen: true } : it)));
      await markItemsAsSent(selectedTable, pending);
    } else if (orderType === "takeaway") {
      if (kotConfig?.enabled) await printKOT(pending);
      const invoice = {
        id: Date.now().toString(),
        billNumber: `BILL-${Date.now()}`,
        orderType: "takeaway",
        items: getAllCombinedItems(),
        subtotal,
        tax,
        total,
        timestamp: new Date(),
      } as any;
      await addInvoice(invoice);
      clearOrder();
    }

    alert("Order placed successfully");
  }, [getPendingItems, existingTableOrder, orderType, selectedTable, addItemsToTable, kotConfig, printKOT, markItemsAsSent, addInvoice, getAllCombinedItems, subtotal, tax, total, clearOrder]);

  const completeBill = useCallback(async () => {
    const invoice = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now()}`,
      orderType: orderType || "takeaway",
      tableName: orderType === "dine-in" ? selectedTableData?.name : undefined,
      items: getAllCombinedItems(),
      subtotal,
      tax,
      total,
      timestamp: new Date(),
    } as any;

    await addInvoice(invoice);
    if (orderType === "dine-in" && selectedTable) await completeTableOrder(selectedTable);
    clearOrder();
    setShowBillDialog(false);
  }, [orderType, selectedTableData?.name, getAllCombinedItems, subtotal, tax, total, addInvoice, selectedTable, completeTableOrder, clearOrder]);

  return (
    <div className="flex h-screen w-full bg-gray-50 relative">
      {/* Main Content Area - accounts for left sidebar (256px) and right cart (340px) */}
      <main 
        className="flex-1 h-full overflow-y-auto" 
        style={{ 
          marginLeft: '256px',
          marginRight: (orderType === "takeaway" || (orderType === "dine-in" && selectedTable)) ? '340px' : '0px'
        }}
      >
        <div className="p-6">
          {!orderType && (
            <div className="flex flex-col items-center justify-center h-full">
              <ShoppingCart className="size-16 text-purple-300 mb-6" />
              <h2 className="text-gray-900 mb-4">Start New Order</h2>
              <p className="text-muted-foreground mb-6">Select order type to begin</p>
              <div className="flex gap-4">
                <Button onClick={() => handleOrderTypeChange("dine-in")} className="px-8 py-6 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-md transition-transform transform hover:scale-105">Dine-In</Button>
                <Button onClick={() => handleOrderTypeChange("takeaway")} className="px-8 py-6 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-lg shadow-md transition-transform transform hover:scale-105">Takeaway</Button>
              </div>
            </div>
          )}

          {orderType === "dine-in" && !selectedTable && (
            <div>
              <div className="mb-6"><h2 className="text-gray-900 mb-2">Select Table</h2><p className="text-muted-foreground">Choose a table for dine-in order</p></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <Card key={table.id} onClick={() => handleTableSelect(table.id)} className={`cursor-pointer`}>
                    <CardHeader className="p-4">
                      <div className="text-center space-y-3">
                        <div><p className="text-gray-900 mb-1">Table {table.name}</p><Badge variant="outline">{table.status}</Badge></div>
                        <div className="text-muted-foreground">{table.seats} seats • {table.category}</div>
                        {table.status === "occupied" && getTableOrder(table.id) && (
                          <div className="pt-2 border-t border-gray-200"><div className="flex items-center justify-center gap-1 text-orange-600"><Clock className="size-3" /><span className="text-sm">{Math.floor((Date.now() - getTableOrder(table.id)!.startTime.getTime()) / 60000)} mins</span></div></div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(orderType === "takeaway" || (orderType === "dine-in" && selectedTable)) && (
            <>
              <div className="mb-6"><h2 className="text-gray-900 mb-2">{orderType === "dine-in" ? `Table ${selectedTableData?.name}` : "Takeaway Order"}</h2><p className="text-muted-foreground">Select items to add to order</p></div>

              <div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input value={searchQuery} onChange={handleSearchChange} placeholder="Search menu items..." className="pl-10 w-full" /></div></div>

              <div className="flex gap-2 mb-6 flex-wrap">{categories.map((c) => (<Button key={c} variant={selectedCategory === c ? "default" : "outline"} onClick={() => handleCategorySelect(c)}>{c}</Button>))}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.length === 0 && (<div className="col-span-full text-center py-12 text-gray-500"><Search className="size-12 mx-auto mb-4 opacity-20" /><p>No items found</p></div>)}

                {filteredItems.map((item) => (
                  <Card key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <CardHeader className="p-4"><div className="space-y-2"><div className="flex justify-between items-start"><div><CardTitle className="text-lg font-semibold">{item.name}</CardTitle><p className="text-sm text-gray-500">{item.category}</p></div><p className="text-lg font-bold text-purple-600">₹{item.price}</p></div><p className="text-sm text-gray-500">{item.description}</p></div></CardHeader>
                    <CardContent className="p-4 pt-0"><Button onClick={() => addToOrder(item)} className="w-full bg-purple-600 hover:bg-purple-700 text-white"><Plus className="size-4 mr-2" /> Add to Order</Button></CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Cart Sidebar - Fixed on right side */}
      {(orderType === "takeaway" || (orderType === "dine-in" && selectedTable)) && (
        <aside className="w-[340px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 h-screen shadow-lg z-30">
          {/* Cart Header - Fixed, no scroll */}
          <header className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Current Order</h3>
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
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-4">
              {currentOrder.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <ShoppingCart className="size-16 mx-auto mb-4 text-gray-300" />
                  <div>No items in order</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getPendingItems().map((it, idx) => (
                    <div key={`${it.id}-${idx}`} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(it.id, -1, false)}>
                            -
                          </Button>
                          <div className="w-8 text-center">{it.quantity}</div>
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(it.id, 1, false)}>
                            +
                          </Button>
                          <div className="ml-4 text-purple-600 font-semibold">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button variant="ghost" onClick={() => removeFromOrder(it.id, false)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Footer - Fixed, no scroll */}
          <div className="border-t p-4 flex-shrink-0">
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

            <div className="mt-4 space-y-2">
              <Button 
                onClick={placeOrder} 
                disabled={getPendingItems().length === 0} 
                className="w-full"
              >
                <Printer className="mr-2" /> 
                {existingTableOrder ? 'Add More Items' : 'Place Order'}
              </Button>
              {orderType === "dine-in" && existingTableOrder && (
                <Button onClick={() => setShowBillDialog(true)} variant="outline" className="w-full">
                  Generate Bill
                </Button>
              )}
            </div>
          </div>
        </aside>
      )}

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>Would you like to print the bill?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between mb-4"><span>Total Amount:</span><span className="text-purple-600">₹{total.toFixed(2)}</span></div>
            <div className="flex gap-2"><Button onClick={() => { printBill(); completeBill(); }} className="flex-1"> <Printer className="mr-2" /> Print Bill</Button><Button onClick={completeBill} variant="outline" className="flex-1">Complete Without Printing</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;

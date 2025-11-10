// src/pages/TakeawayPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, ShoppingCart, Trash2, Printer, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useRestaurant } from "../contexts/RestaurantContext";
import * as api from "../services/api";
import { MenuItem } from "../types";
import { useCart } from "../hooks/useCart"; // <- shared cart

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sentToKitchen?: boolean;
  department?: string;
}

export const TakeawayPage: React.FC = () => {
  const { addInvoice, kotConfig, billConfig, printKOT, generateBillContent } = useRestaurant();

  const { currentOrder, addToOrder, updateQuantity, removeFromOrder, clearOrder, getPendingItems, getAllCombinedItems, subtotal, tax, total, setOrderType, orderType } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBillDialog, setShowBillDialog] = useState(false);

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

  // ensure cart has takeaway order type when entering this page
  useEffect(() => {
    setOrderType("takeaway");
  }, [setOrderType]);

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

  const handleCategorySelect = useCallback((c: string) => setSelectedCategory(c), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  const printBill = useCallback(() => {
    const content = generateBillContent?.({
      items: getAllCombinedItems(),
      subtotal,
      tax,
      total,
      orderType: "takeaway",
    });
    if (!content) return;
    const popup = window.open("", "_blank", "width=600,height=800");
    if (!popup) return;
    popup.document.write(content);
    setTimeout(() => {
      popup.print();
      popup.close();
    }, 200);
  }, [generateBillContent, getAllCombinedItems, subtotal, tax, total]);

  const placeOrder = useCallback(async () => {
    const pending = getPendingItems();
    if (!pending.length) return;

    if (kotConfig.printByDepartment !== undefined) await printKOT(pending);
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

    alert("Order placed successfully");
  }, [getPendingItems, kotConfig, printKOT, addInvoice, getAllCombinedItems, subtotal, tax, total, clearOrder]);

  const completeBill = useCallback(async () => {
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
    setShowBillDialog(false);
  }, [getAllCombinedItems, subtotal, tax, total, addInvoice, clearOrder]);

  // Determine if cart should be visible
  const isCartVisible = currentOrder.length > 0;

  return (
    <>
      <div
        className="h-full overflow-y-auto"
        style={{
          width: isCartVisible ? "calc(100% - 420px)" : "100%",
          transition: "width 0.3s ease",
          marginRight: 0,
          paddingRight: 0,
        }}
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-gray-900 mb-2">Takeaway Order</h2>
            <p className="text-muted-foreground">Select items for takeaway order</p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input value={searchQuery} onChange={handleSearchChange} placeholder="Search menu items..." className="pl-10 w-full" />
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((c) => (
              <Button key={c} variant={selectedCategory === c ? "default" : "outline"} onClick={() => handleCategorySelect(c)}>
                {c}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Search className="size-12 mx-auto mb-4 opacity-20" />
                <p>No items found</p>
              </div>
            )}

            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <CardHeader className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <p className="text-lg font-bold text-purple-600">₹{item.price}</p>
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button
                    onClick={() => {
                      console.log("Button clicked for item:", item);
                      addToOrder(item);
                    }}
                    variant="default"
                    type="button"
                    className="w-full !bg-purple-600 hover:!bg-purple-700 !text-white border-0"
                    style={{ backgroundColor: "#9333ea", color: "white", cursor: "pointer" }}
                  >
                    <Plus className="size-4 mr-2" /> Add to Order
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      {isCartVisible && (
        <div
          className="fixed top-0 right-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-lg flex flex-col z-30"
          style={{
            marginTop: 0,
            paddingTop: "1rem",
          }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900 text-xl font-semibold">Takeaway Order</h2>
              <Button variant="ghost" size="sm" onClick={clearOrder}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="text-muted-foreground">
              <p>Takeaway Order</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentOrder.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="size-12 mx-auto mb-4 opacity-20" />
                <p>No items in order</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, -1, item.sentToKitchen)} disabled={item.sentToKitchen}>
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, 1, item.sentToKitchen)} disabled={item.sentToKitchen}>
                        +
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFromOrder(item.id, item.sentToKitchen)} disabled={item.sentToKitchen}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentOrder.length > 0 && (
            <div className="p-6 border-t border-gray-200 space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <Button onClick={placeOrder} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" disabled={currentOrder.every(item => item.sentToKitchen)}>
                Place Order
              </Button>
              <Button variant="outline" onClick={() => setShowBillDialog(true)} className="w-full">
                <Printer className="size-4 mr-2" /> Complete Bill
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Bill</DialogTitle>
            <DialogDescription>Review and print the final bill for this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={printBill} className="flex-1">
                <Printer className="size-4 mr-2" /> Print
              </Button>
              <Button onClick={completeBill} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TakeawayPage;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Plus, ShoppingCart, Trash2, Printer, Clock, Search } from "lucide-react";
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
          <div className="mb-6"><h2 className="text-gray-900 mb-2">Takeaway Order</h2><p className="text-muted-foreground">Select items for takeaway order</p></div>

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

      {/* Cart Panel - Fixed position on right side */}
      {isCartVisible && (
        <div 
          className="fixed top-0 right-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-lg flex flex-col z-30"
          style={{ 
            marginTop: 0,
            paddingTop: '1rem'
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateQuantity(item.id, -1, item.sentToKitchen)}
                        disabled={item.sentToKitchen}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateQuantity(item.id, 1, item.sentToKitchen)}
                        disabled={item.sentToKitchen}
                      >
                        +
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFromOrder(item.id, item.sentToKitchen)}
                        disabled={item.sentToKitchen}
                      >
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
              <Button 
                onClick={placeOrder}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={currentOrder.every(item => item.sentToKitchen)}
              >
                Place Order
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBillDialog(true)}
                className="w-full"
              >
                <Printer className="size-4 mr-2" /> Complete Bill
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Bill</DialogTitle>
            <DialogDescription>
              Review and print the final bill for this order
            </DialogDescription>
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
              <Button 
                variant="outline" 
                onClick={printBill}
                className="flex-1"
              >
                <Printer className="size-4 mr-2" /> Print
              </Button>
              <Button 
                onClick={completeBill}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
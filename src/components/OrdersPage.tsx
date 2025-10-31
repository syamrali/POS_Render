import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Plus, Minus, ShoppingCart, Trash2, Printer, Clock } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useRestaurant, type OrderItem } from "../contexts/RestaurantContext";

// Mock data - In real app, this would come from a shared state/database
const menuItems = [
  { id: "1", name: "Classic Burger", price: 259, category: "Mains", department: "Kitchen", description: "Beef patty with lettuce, tomato, cheese" },
  { id: "2", name: "Caesar Salad", price: 199, category: "Salads", department: "Kitchen", description: "Romaine lettuce, croutons, parmesan" },
  { id: "3", name: "Margherita Pizza", price: 299, category: "Mains", department: "Kitchen", description: "Fresh mozzarella, basil, tomato sauce" },
  { id: "4", name: "Fish & Chips", price: 319, category: "Mains", department: "Kitchen", description: "Beer-battered fish with crispy fries" },
  { id: "5", name: "Greek Salad", price: 219, category: "Salads", department: "Kitchen", description: "Feta, olives, cucumber, tomatoes" },
  { id: "6", name: "Pasta Carbonara", price: 279, category: "Mains", department: "Kitchen", description: "Creamy sauce with bacon and parmesan" },
  { id: "7", name: "Coca Cola", price: 59, category: "Beverages", department: "Bar", description: "330ml can" },
  { id: "8", name: "Fresh Orange Juice", price: 99, category: "Beverages", department: "Bar", description: "Freshly squeezed" },
  { id: "9", name: "Chocolate Cake", price: 139, category: "Desserts", department: "Kitchen", description: "Rich chocolate layer cake" },
  { id: "10", name: "Ice Cream Sundae", price: 119, category: "Desserts", department: "Kitchen", description: "Vanilla ice cream with toppings" },
];

const categories = ["All", "Mains", "Salads", "Beverages", "Desserts"];

export function OrdersPage() {
  const { tables, addItemsToTable, getTableOrder, completeTableOrder, markItemsAsSent, addInvoice, kotConfig, billConfig } = useRestaurant();
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [showBillDialog, setShowBillDialog] = useState(false);

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const selectedTableData = tables.find(t => t.id === selectedTable);
  const existingTableOrder = selectedTable ? getTableOrder(selectedTable) : undefined;

  // Load existing order when table is selected
  useEffect(() => {
    if (selectedTable && orderType === "dine-in") {
      const tableOrder = getTableOrder(selectedTable);
      if (tableOrder) {
        // Load existing order items
        setCurrentOrder(tableOrder.items.map(item => ({ ...item })));
      } else {
        setCurrentOrder([]);
      }
    }
  }, [selectedTable, orderType, getTableOrder]);

  const handleOrderTypeChange = (type: "dine-in" | "takeaway") => {
    setOrderType(type);
    setCurrentOrder([]);
    setSelectedTable("");
  };

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
  };

  const addToOrder = (item: typeof menuItems[0]) => {
    setCurrentOrder(prev => {
      const existingItem = prev.find(orderItem => orderItem.id === item.id && !orderItem.sentToKitchen);
      if (existingItem) {
        return prev.map(orderItem =>
          orderItem.id === item.id && !orderItem.sentToKitchen
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      return [...prev, { ...item, quantity: 1, sentToKitchen: false }];
    });
  };

  const updateQuantity = (id: string, delta: number, sentToKitchen?: boolean) => {
    setCurrentOrder(prev => {
      const updated = prev.map(item =>
        item.id === id && item.sentToKitchen === sentToKitchen
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      );
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeFromOrder = (id: string, sentToKitchen?: boolean) => {
    setCurrentOrder(prev => prev.filter(item => !(item.id === id && item.sentToKitchen === sentToKitchen)));
  };

  const getPendingItems = () => {
    return currentOrder.filter(item => !item.sentToKitchen);
  };

  const getAllItems = () => {
    // Combine items with same id
    const itemMap = new Map<string, OrderItem>();
    currentOrder.forEach(item => {
      const existing = itemMap.get(item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.id, { ...item });
      }
    });
    return Array.from(itemMap.values());
  };

  const subtotal = getAllItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  const clearOrder = () => {
    setCurrentOrder([]);
    setOrderType(null);
    setSelectedTable("");
  };

  const printKOT = async (items: OrderItem[], isAdditional = false) => {
    const printSingleKOT = (content: string) => {
      return new Promise<void>((resolve) => {
        const kotWindow = window.open('', '', 'width=300,height=600');
        if (!kotWindow) {
          resolve();
          return;
        }

        kotWindow.document.write(content);
        kotWindow.document.close();
        
        // Wait for window to load before printing
        kotWindow.onload = () => {
          kotWindow.print();
          // Give time for print dialog to appear and close
          setTimeout(() => {
            kotWindow.close();
            resolve();
          }, 500);
        };
        
        // Fallback if onload doesn't fire
        setTimeout(() => {
          kotWindow.print();
          setTimeout(() => {
            kotWindow.close();
            resolve();
          }, 500);
        }, 100);
      });
    };

    if (kotConfig.printByDepartment) {
      // Group items by department
      const departmentGroups = new Map<string, OrderItem[]>();
      items.forEach(item => {
        const existing = departmentGroups.get(item.department) || [];
        departmentGroups.set(item.department, [...existing, item]);
      });

      // Print separate KOT for each department sequentially
      for (const [department, deptItems] of departmentGroups) {
        for (let i = 0; i < kotConfig.numberOfCopies; i++) {
          const kotContent = generateKOTContent(deptItems, isAdditional, department);
          await printSingleKOT(kotContent);
          // Delay between copies
          if (i < kotConfig.numberOfCopies - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        // Delay between departments
        if (departmentGroups.size > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      // Print all items together
      for (let i = 0; i < kotConfig.numberOfCopies; i++) {
        const kotContent = generateKOTContent(items, isAdditional);
        await printSingleKOT(kotContent);
        // Delay between copies
        if (i < kotConfig.numberOfCopies - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }
  };

  const generateKOTContent = (items: OrderItem[], isAdditional = false, department?: string) => {
    const now = new Date();
    const orderNumber = `KOT-${Date.now()}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${orderNumber}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
          }
          body {
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
          }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; }
          .additional { background: #000; color: #fff; padding: 5px; margin: 5px 0; text-align: center; }
          .info { margin: 10px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .items { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin: 10px 0; }
          .item { margin: 5px 0; }
          .item-name { font-weight: bold; }
          .qty { font-size: 14px; font-weight: bold; }
          .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">KITCHEN ORDER TICKET</div>
          <div>Restaurant POS</div>
          ${department ? `<div style="font-weight: bold; margin-top: 5px;">[${department}]</div>` : ''}
        </div>
        ${isAdditional ? '<div class="additional">*** ADDITIONAL ITEMS ***</div>' : ''}
        <div class="info">
          <div class="info-row"><span>KOT No:</span><span><strong>${orderNumber}</strong></span></div>
          <div class="info-row"><span>Date:</span><span>${now.toLocaleDateString()}</span></div>
          <div class="info-row"><span>Time:</span><span>${now.toLocaleTimeString()}</span></div>
          <div class="info-row"><span>Type:</span><span><strong>${orderType?.toUpperCase()}</strong></span></div>
          ${orderType === 'dine-in' && selectedTableData ? `<div class="info-row"><span>Table:</span><span><strong>${selectedTableData.name}</strong></span></div>` : ''}
        </div>
        <div class="items">
          ${items.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div style="display: flex; justify-content: space-between;">
                <span class="qty">Qty: ${item.quantity}</span>
                <span>[${item.department}]</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="footer">
          *** Please prepare this order ***
        </div>
      </body>
      </html>
    `;
  };

  const generateBillContent = () => {
    const now = new Date();
    const billNumber = `BILL-${Date.now()}`;
    const allItems = getAllItems();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${billNumber}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
          }
          body {
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10px;
          }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; }
          .info { margin: 10px 0; font-size: 11px; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .items { border-top: 2px dashed #000; padding: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .totals { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin: 10px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .grand-total { font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">RESTAURANT POS</div>
          <div>Tax Invoice</div>
        </div>
        <div class="info">
          <div class="info-row"><span>Bill No:</span><span>${billNumber}</span></div>
          <div class="info-row"><span>Date:</span><span>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</span></div>
          <div class="info-row"><span>Type:</span><span>${orderType?.toUpperCase()}</span></div>
          ${orderType === 'dine-in' && selectedTableData ? `<div class="info-row"><span>Table:</span><span>${selectedTableData.name}</span></div>` : ''}
        </div>
        <div class="items">
          ${allItems.map(item => `
            <div class="item-row">
              <div style="flex: 2;">
                <div>${item.name}</div>
                <div style="font-size: 10px;">${item.quantity} x ₹${item.price.toFixed(2)}</div>
              </div>
              <div style="text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div class="total-row"><span>GST (5%):</span><span>₹${tax.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>TOTAL:</span><span>₹${total.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <div>Thank you for dining with us!</div>
          <div>Please visit again</div>
        </div>
      </body>
      </html>
    `;
  };

  const printBill = () => {
    const billWindow = window.open('', '', 'width=300,height=600');
    if (!billWindow) return;

    const billContent = generateBillContent();
    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.print();
  };

  const placeOrder = async () => {
    const pendingItems = getPendingItems();
    if (pendingItems.length === 0) return;

    const isAdditionalOrder = existingTableOrder !== undefined;

    if (orderType === "dine-in" && selectedTable) {
      // Add items to table
      await addItemsToTable(selectedTable, selectedTableData?.name || "", pendingItems);
      
      // Print KOT automatically
      printKOT(pendingItems, isAdditionalOrder);
      
      // Mark items as sent
      setTimeout(() => {
        markItemsAsSent(selectedTable);
      }, 100);

      // Auto-print bill if enabled
      if (billConfig.autoPrintDineIn) {
        setTimeout(() => {
          printBill();
        }, 1000);
      }
    } else if (orderType === "takeaway") {
      // Print KOT for takeaway
      printKOT(pendingItems, false);
      
      // Auto-print bill or show dialog
      if (billConfig.autoPrintTakeaway) {
        setTimeout(() => {
          printBill();
          // Create invoice
          const invoice = {
            id: Date.now().toString(),
            billNumber: `BILL-${Date.now()}`,
            orderType: "takeaway" as const,
            items: getAllItems(),
            subtotal,
            tax,
            total,
            timestamp: new Date(),
          };
          addInvoice(invoice);
          clearOrder();
        }, 1000);
      } else {
        setTimeout(() => {
          setShowBillDialog(true);
        }, 500);
      }
    }
  };

  const completeBill = async () => {
    // Create invoice
    const invoice = {
      id: Date.now().toString(),
      billNumber: `BILL-${Date.now()}`,
      orderType: orderType!,
      tableName: orderType === "dine-in" ? selectedTableData?.name : undefined,
      items: getAllItems(),
      subtotal,
      tax,
      total,
      timestamp: new Date(),
    };
    await addInvoice(invoice);

    if (orderType === "dine-in" && selectedTable) {
      await completeTableOrder(selectedTable);
    }
    clearOrder();
    setShowBillDialog(false);
  };

  return (
    <div className="flex h-full">
      {/* Left Section - Table Selection or Menu */}
      <div className="flex-1 p-6">
        {!orderType && (
          <div className="flex flex-col items-center justify-center h-full">
            <ShoppingCart className="size-16 text-purple-300 mb-6" />
            <h2 className="text-gray-900 mb-4">Start New Order</h2>
            <p className="text-muted-foreground mb-6">Select order type to begin</p>
            <div className="flex gap-4">
              <Button
                onClick={() => handleOrderTypeChange("dine-in")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6"
              >
                Dine-In
              </Button>
              <Button
                onClick={() => handleOrderTypeChange("takeaway")}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-6"
              >
                Takeaway
              </Button>
            </div>
          </div>
        )}

        {orderType === "dine-in" && !selectedTable && (
          <div>
            <div className="mb-6">
              <h2 className="text-gray-900 mb-2">Select Table</h2>
              <p className="text-muted-foreground">Choose a table for dine-in order</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => (
                <Card
                  key={table.id}
                  onClick={() => handleTableSelect(table.id)}
                  className={`cursor-pointer hover:shadow-lg transition-all ${
                    table.status === "available"
                      ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                      : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="text-center space-y-3">
                      <div>
                        <p className="text-gray-900 mb-1">Table {table.name}</p>
                        <Badge
                          className={
                            table.status === "available"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-orange-100 text-orange-700 border-orange-200"
                          }
                          variant="outline"
                        >
                          {table.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        {table.seats} seats • {table.category}
                      </div>
                      {table.status === "occupied" && getTableOrder(table.id) && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-center gap-1 text-orange-600">
                            <Clock className="size-3" />
                            <span className="text-sm">
                              {Math.floor((Date.now() - getTableOrder(table.id)!.startTime.getTime()) / 60000)} mins
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(orderType === "takeaway" || (orderType === "dine-in" && selectedTable)) && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-gray-900 mb-2">
                  {orderType === "dine-in" ? `Table ${selectedTableData?.name}` : "Takeaway Order"}
                </h2>
                <p className="text-muted-foreground">Select items to add to order</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (orderType === "dine-in") {
                    setSelectedTable("");
                  } else {
                    setOrderType(null);
                  }
                  setCurrentOrder([]);
                }}
              >
                Change {orderType === "dine-in" ? "Table" : "Type"}
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : ""
                  }
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-gray-900">{item.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">{item.category}</Badge>
                      </div>
                      <p className="text-purple-600">₹{item.price}</p>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => addToOrder(item)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="size-4 mr-2" />
                      Add to Order
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Section - Order Summary */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="size-5 text-purple-600" />
            <h3 className="text-gray-900">Current Order</h3>
          </div>
          <p className="text-muted-foreground">
            {getAllItems().length} {getAllItems().length === 1 ? "item" : "items"}
          </p>
        </div>

        <ScrollArea className="flex-1 p-6">
          {currentOrder.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingCart className="size-12 mx-auto mb-4 opacity-20" />
              <p>No items in order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Items */}
              {getPendingItems().length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">New Items</p>
                  {getPendingItems().map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-start gap-3 pb-4 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() => updateQuantity(item.id, -1, false)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() => updateQuantity(item.id, 1, false)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromOrder(item.id, false)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent to Kitchen Items */}
              {currentOrder.filter(item => item.sentToKitchen).length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">Sent to Kitchen</p>
                  {currentOrder.filter(item => item.sentToKitchen).map((item, index) => (
                    <div key={`${item.id}-sent-${index}`} className="flex items-start gap-3 pb-4 border-b border-gray-100 opacity-60">
                      <div className="flex-1">
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-center">x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Total</span>
              <span className="text-purple-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={placeOrder}
              disabled={getPendingItems().length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Printer className="size-4 mr-2" />
              {existingTableOrder ? "Add More Items" : "Place Order"}
            </Button>
            {orderType === "dine-in" && existingTableOrder && (
              <Button
                onClick={() => setShowBillDialog(true)}
                disabled={currentOrder.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Printer className="size-4 mr-2" />
                Generate Bill
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bill Generation Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Bill</DialogTitle>
            <DialogDescription>
              Would you like to print the bill?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="text-purple-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  printBill();
                  completeBill();
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Printer className="size-4 mr-2" />
                Print Bill
              </Button>
              <Button
                onClick={completeBill}
                variant="outline"
                className="flex-1"
              >
                Complete Without Printing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
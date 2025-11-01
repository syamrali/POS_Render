import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar, Printer, Search, Filter } from "lucide-react";
import { useRestaurant } from "../contexts/RestaurantContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function InvoicesPage() {
  const { invoices } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.tableName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && invoice.timestamp >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && invoice.timestamp <= end;
    }

    return matchesSearch && matchesDate;
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalOrders = filteredInvoices.length;
  const dineInOrders = filteredInvoices.filter(inv => inv.orderType === "dine-in").length;
  const takeawayOrders = filteredInvoices.filter(inv => inv.orderType === "takeaway").length;

  const printInvoice = (invoice: typeof invoices[0]) => {
    const billWindow = window.open('', '', 'width=300,height=600');
    if (!billWindow) return;

    const billContent = generateBillContent(invoice);
    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.print();
  };

  const generateBillContent = (invoice: typeof invoices[0]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${invoice.billNumber}</title>
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
          <div class="info-row"><span>Bill No:</span><span>${invoice.billNumber}</span></div>
          <div class="info-row"><span>Date:</span><span>${invoice.timestamp.toLocaleDateString()} ${invoice.timestamp.toLocaleTimeString()}</span></div>
          <div class="info-row"><span>Type:</span><span>${invoice.orderType.toUpperCase()}</span></div>
          ${invoice.tableName ? `<div class="info-row"><span>Table:</span><span>${invoice.tableName}</span></div>` : ''}
        </div>
        <div class="items">
          ${invoice.items.map(item => `
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
          <div class="total-row"><span>Subtotal:</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
          <div class="total-row"><span>GST (5%):</span><span>₹${invoice.tax.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>TOTAL:</span><span>₹${invoice.total.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <div>Thank you for dining with us!</div>
          <div>Please visit again</div>
        </div>
      </body>
      </html>
    `;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Invoices</h2>
        <p className="text-muted-foreground">View and manage all generated bills</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-purple-600">₹{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Total Orders</p>
            <p className="text-blue-600">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Dine-In</p>
            <p className="text-green-600">{dineInOrders}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Takeaway</p>
            <p className="text-orange-600">{takeawayOrders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Bill number, table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <Filter className="size-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-500px)]">
            <div className="space-y-3">
              {filteredInvoices.map(invoice => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowInvoiceDialog(true);
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-gray-900">{invoice.billNumber}</p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.orderType === "dine-in"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }
                      >
                        {invoice.orderType}
                      </Badge>
                      {invoice.tableName && (
                        <Badge variant="secondary">{invoice.tableName}</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{invoice.timestamp.toLocaleDateString()}</span>
                      <span>{invoice.timestamp.toLocaleTimeString()}</span>
                      <span>{invoice.items.length} items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-purple-600">₹{invoice.total.toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        printInvoice(invoice);
                      }}
                    >
                      <Printer className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredInvoices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No invoices found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedInvoice?.billNumber}</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.timestamp.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedInvoice.orderType === "dine-in"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }
                  >
                    {selectedInvoice.orderType}
                  </Badge>
                </div>
                {selectedInvoice.tableName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table:</span>
                    <span>{selectedInvoice.tableName}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-900 mb-3">Items:</p>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%):</span>
                  <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="text-purple-600">₹{selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => printInvoice(selectedInvoice)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Printer className="size-4 mr-2" />
                Print Invoice
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
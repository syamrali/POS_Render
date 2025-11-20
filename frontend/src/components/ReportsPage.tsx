import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar, Download, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { useRestaurant } from "../contexts/RestaurantContext";

export function ReportsPage() {
  const { invoices } = useRestaurant();
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const getReportData = (startDate: Date, endDate: Date) => {
    const filtered = invoices.filter((inv: any) => {
      const invDate = new Date(inv.timestamp);
      return invDate >= startDate && invDate <= endDate;
    });

    const totalRevenue = filtered.reduce((sum: number, inv: any) => sum + inv.total, 0);
    const totalOrders = filtered.length;
    const dineInOrders = filtered.filter((inv: any) => inv.orderType === "dine-in").length;
    const takeawayOrders = filtered.filter((inv: any) => inv.orderType === "takeaway").length;
    const dineInRevenue = filtered
      .filter((inv: any) => inv.orderType === "dine-in")
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
    const takeawayRevenue = filtered
      .filter((inv: any) => inv.orderType === "takeaway")
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling items
    const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    filtered.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        const existing = itemSales.get(item.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          itemSales.set(item.id, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });
    });

    const topItems = Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      dineInOrders,
      takeawayOrders,
      dineInRevenue,
      takeawayRevenue,
      averageOrderValue,
      topItems,
    };
  };

  const dailyReport = getReportData(startOfToday, new Date());
  const weeklyReport = getReportData(startOfWeek, new Date());
  const monthlyReport = getReportData(startOfMonth, new Date());
  
  const customReport = customStartDate && customEndDate
    ? getReportData(new Date(customStartDate), new Date(customEndDate + "T23:59:59"))
    : null;

  const downloadReport = (data: ReturnType<typeof getReportData>, period: string) => {
    const content = `
Restaurant POS - ${period} Sales Report
Generated: ${new Date().toLocaleString()}

=================================
SUMMARY
=================================
Total Revenue: ₹${data.totalRevenue.toFixed(2)}
Total Orders: ${data.totalOrders}
Average Order Value: ₹${data.averageOrderValue.toFixed(2)}

=================================
ORDER BREAKDOWN
=================================
Dine-In Orders: ${data.dineInOrders} (₹${data.dineInRevenue.toFixed(2)})
Takeaway Orders: ${data.takeawayOrders} (₹${data.takeawayRevenue.toFixed(2)})

=================================
TOP SELLING ITEMS
=================================
${data.topItems.map((item, idx) => `${idx + 1}. ${item.name}
   Quantity: ${item.quantity}
   Revenue: ₹${item.revenue.toFixed(2)}`).join('\n\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${period.toLowerCase().replace(/\s+/g, '-')}-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ReportCard = ({ data, title }: { data: ReturnType<typeof getReportData>; title: string }) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-900">{title}</h3>
        <Button
          onClick={() => downloadReport(data, title)}
          variant="outline"
        >
          <Download className="size-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Total Revenue</p>
                <p style={{ color: '#0C3B2E' }}>₹{data.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#6D9773' }}>
                <DollarSign className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Total Orders</p>
                <p style={{ color: '#0C3B2E' }}>{data.totalOrders}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#6D9773' }}>
                <ShoppingBag className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border" style={{ backgroundColor: '#6D977310', borderColor: '#6D9773' }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground mb-1">Avg Order Value</p>
                <p style={{ color: '#0C3B2E' }}>₹{data.averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#6D9773' }}>
                <TrendingUp className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Order Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-muted-foreground mb-1">Dine-In</p>
              <p className="text-green-700 mb-1">{data.dineInOrders} orders</p>
              <p className="text-green-600">₹{data.dineInRevenue.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-muted-foreground mb-1">Takeaway</p>
              <p className="text-orange-700 mb-1">{data.takeawayOrders} orders</p>
              <p className="text-orange-600">₹{data.takeawayRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topItems.length > 0 ? (
            <div className="space-y-3">
              {data.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D977320' }}>
                      <span style={{ color: '#0C3B2E' }}>{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-gray-900">{item.name}</p>
                      <p className="text-muted-foreground">{item.quantity} sold</p>
                    </div>
                  </div>
                  <p style={{ color: '#0C3B2E' }}>₹{item.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Sales Reports</h2>
        <p className="text-muted-foreground">View and analyze sales performance</p>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="custom">Custom Period</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <ReportCard data={dailyReport} title="Daily Report" />
        </TabsContent>

        <TabsContent value="weekly">
          <ReportCard data={weeklyReport} title="Weekly Report" />
        </TabsContent>

        <TabsContent value="monthly">
          <ReportCard data={monthlyReport} title="Monthly Report" />
        </TabsContent>

        <TabsContent value="custom">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-start">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="custom-start"
                        type="date"
                        value={customStartDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-end">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="custom-end"
                        type="date"
                        value={customEndDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customReport ? (
              <ReportCard
                data={customReport}
                title={`Custom Report (${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()})`}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="size-16 mx-auto mb-4 opacity-20" />
                  <p>Select start and end dates to generate custom report</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
      </div>
    );
}

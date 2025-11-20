import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Clock, Award } from "lucide-react";
import * as api from "../services/api";

interface DashboardStats {
  todaySales: number;
  yesterdaySales: number;
  todayOrders: number;
  yesterdayOrders: number;
  averageOrderValue: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  occupiedTables: number;
  totalTables: number;
  peakHour: string;
  salesByType: { dineIn: number; takeaway: number };
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    yesterdaySales: 0,
    todayOrders: 0,
    yesterdayOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    occupiedTables: 0,
    totalTables: 0,
    peakHour: "N/A",
    salesByType: { dineIn: 0, takeaway: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [invoices, tables] = await Promise.all([
        api.getInvoices(),
        api.getTables()
      ]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      // Filter today's and yesterday's invoices
      const todayInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.timestamp);
        return invDate >= todayStart;
      });

      const yesterdayInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.timestamp);
        return invDate >= yesterdayStart && invDate < todayStart;
      });

      // Calculate stats
      const todaySales = todayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const yesterdaySales = yesterdayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const todayOrders = todayInvoices.length;
      const yesterdayOrders = yesterdayInvoices.length;
      const averageOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0;

      // Calculate sales by type
      const salesByType = todayInvoices.reduce(
        (acc: any, inv: any) => {
          if (inv.orderType === 'dine-in') {
            acc.dineIn += inv.total;
          } else {
            acc.takeaway += inv.total;
          }
          return acc;
        },
        { dineIn: 0, takeaway: 0 }
      );

      // Top selling items
      const itemSales: Record<string, { quantity: number; revenue: number; name: string }> = {};
      todayInvoices.forEach((inv: any) => {
        inv.items.forEach((item: any) => {
          if (!itemSales[item.id]) {
            itemSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemSales[item.id].quantity += item.quantity;
          itemSales[item.id].revenue += item.price * item.quantity;
        });
      });

      const topSellingItems = Object.values(itemSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Peak hour analysis
      const hourSales: Record<number, number> = {};
      todayInvoices.forEach((inv: any) => {
        const hour = new Date(inv.timestamp).getHours();
        hourSales[hour] = (hourSales[hour] || 0) + inv.total;
      });

      const peakHourNum = Object.entries(hourSales).reduce(
        (max, [hour, sales]) => (sales > max.sales ? { hour: parseInt(hour), sales } : max),
        { hour: 0, sales: 0 }
      );

      const peakHour = peakHourNum.sales > 0
        ? `${peakHourNum.hour}:00 - ${peakHourNum.hour + 1}:00`
        : "N/A";

      // Table stats
      const occupiedTables = tables.filter((t: any) => t.status === 'occupied').length;
      const totalTables = tables.length;

      setStats({
        todaySales,
        yesterdaySales,
        todayOrders,
        yesterdayOrders,
        averageOrderValue,
        topSellingItems,
        occupiedTables,
        totalTables,
        peakHour,
        salesByType
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  const calculatePercentageChange = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  const salesChange = calculatePercentageChange(stats.todaySales, stats.yesterdaySales);
  const ordersChange = calculatePercentageChange(stats.todayOrders, stats.yesterdayOrders);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Today's Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
              <DollarSign className="size-4" style={{ color: '#6D9773' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{stats.todaySales.toFixed(2)}</div>
              <div className="flex items-center gap-1 mt-1">
                {salesChange >= 0 ? (
                  <TrendingUp className="size-4" style={{ color: '#6D9773' }} />
                ) : (
                  <TrendingDown className="size-4" style={{ color: '#BB8A52' }} />
                )}
                <span className="text-xs" style={{ color: salesChange >= 0 ? '#6D9773' : '#BB8A52' }}>
                  {Math.abs(salesChange).toFixed(1)}% vs yesterday
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Yesterday: ₹{stats.yesterdaySales.toFixed(2)}</p>
            </CardContent>
          </Card>

          {/* Today's Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Orders</CardTitle>
              <ShoppingCart className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.todayOrders}</div>
              <div className="flex items-center gap-1 mt-1">
                {ordersChange >= 0 ? (
                  <TrendingUp className="size-4" style={{ color: '#6D9773' }} />
                ) : (
                  <TrendingDown className="size-4" style={{ color: '#BB8A52' }} />
                )}
                <span className="text-xs" style={{ color: ordersChange >= 0 ? '#6D9773' : '#BB8A52' }}>
                  {Math.abs(ordersChange).toFixed(1)}% vs yesterday
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Yesterday: {stats.yesterdayOrders} orders</p>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
              <Package className="size-4" style={{ color: '#0C3B2E' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Per order today</p>
            </CardContent>
          </Card>

          {/* Table Occupancy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Table Occupancy</CardTitle>
              <Users className="size-4" style={{ color: '#FFBA00' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.occupiedTables}/{stats.totalTables}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalTables > 0 ? ((stats.occupiedTables / stats.totalTables) * 100).toFixed(0) : 0}% occupied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Sales by Order Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Dine-In</span>
                    <span className="text-sm font-bold text-gray-900">₹{stats.salesByType.dineIn.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: '#0C3B2E',
                        width: `${stats.todaySales > 0 ? (stats.salesByType.dineIn / stats.todaySales) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.todaySales > 0 ? ((stats.salesByType.dineIn / stats.todaySales) * 100).toFixed(1) : 0}% of total sales
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Takeaway</span>
                    <span className="text-sm font-bold text-gray-900">₹{stats.salesByType.takeaway.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: '#6D9773',
                        width: `${stats.todaySales > 0 ? (stats.salesByType.takeaway / stats.todaySales) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.todaySales > 0 ? ((stats.salesByType.takeaway / stats.todaySales) * 100).toFixed(1) : 0}% of total sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hour & Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFBA0020' }}>
                    <Clock className="size-5" style={{ color: '#FFBA00' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                    <p className="text-lg font-bold text-gray-900">{stats.peakHour}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6D977320' }}>
                    <Award className="size-5" style={{ color: '#6D9773' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Seller</p>
                    <p className="text-lg font-bold text-gray-900">
                      {stats.topSellingItems.length > 0 ? stats.topSellingItems[0].name : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Selling Items Today</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSellingItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No sales data available</p>
            ) : (
              <div className="space-y-3">
                {stats.topSellingItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0C3B2E20' }}>
                        <span className="text-sm font-bold" style={{ color: '#0C3B2E' }}>#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{item.revenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

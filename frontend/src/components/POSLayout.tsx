import { useState } from "react";
import { UtensilsCrossed, TableProperties, Settings, LogOut, ShoppingCart, FileText, BarChart3, FolderPlus, Tag, Home, Package, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { DashboardPage } from "./DashboardPage";
import { MenuPage } from "./MenuPage";
import { TablesPage } from "./TablesPage";
import { SettingsPage } from "./SettingsPage";
import { InvoicesPage } from "./InvoicesPage";
import { ReportsPage } from "./ReportsPage";
import { DepartmentsPage } from "./DepartmentsPage";
import { CategoriesPage } from "./CategoriesPage";
import { DineInPage } from "./DineInPage";
import { TakeawayPage } from "./TakeawayPage";

interface POSLayoutProps {
  onLogout: () => void;
}

type PageType = "dashboard" | "dine-in" | "takeaway" | "menu" | "departments" | "categories" | "tables" | "invoices" | "reports" | "settings";

export function POSLayout({ onLogout }: POSLayoutProps) {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");

  const navItems = [
    { id: "dashboard" as PageType, label: "Dashboard", icon: LayoutDashboard },
    { id: "dine-in" as PageType, label: "Dine In", icon: Home },
    { id: "takeaway" as PageType, label: "Take Away", icon: Package },
    { id: "menu" as PageType, label: "Menu", icon: UtensilsCrossed },
    { id: "departments" as PageType, label: "Departments", icon: FolderPlus },
    { id: "categories" as PageType, label: "Categories", icon: Tag },
    { id: "tables" as PageType, label: "Tables", icon: TableProperties },
    { id: "invoices" as PageType, label: "Invoices", icon: FileText },
    { id: "reports" as PageType, label: "Reports", icon: BarChart3 },
    { id: "settings" as PageType, label: "Settings", icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "dine-in":
        return <DineInPage />;
      case "takeaway":
        return <TakeawayPage />;
      case "menu":
        return <MenuPage />;
      case "departments":
        return <DepartmentsPage />;
      case "categories":
        return <CategoriesPage />;
      case "tables":
        return <TablesPage />;
      case "invoices":
        return <InvoicesPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Sidebar - Fixed with solid green color */}
      <aside 
        className="fixed left-0 top-0 w-64 text-white flex flex-col overflow-y-auto shadow-2xl z-40" 
        style={{ 
          height: '100vh',
          backgroundColor: '#6D9773'
        }}
      >
        <div className="p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">Restaurant POS</h1>
          <p className="text-base" style={{ color: '#FFBA00' }}>Point of Sale System</p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? "bg-white shadow-lg font-medium"
                    : "text-white hover:bg-white/10"
                }`}
                style={{
                  color: isActive ? '#0C3B2E' : 'white'
                }}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="size-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-gray-50" style={{ marginLeft: '256px' }}>
        {renderPage()}
      </main>
    </div>
  );
}
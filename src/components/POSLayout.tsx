import { useState } from "react";
import { UtensilsCrossed, TableProperties, Settings, LogOut, ShoppingCart, FileText, BarChart3, FolderPlus, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { MenuPage } from "./MenuPage";
import { TablesPage } from "./TablesPage";
import { SettingsPage } from "./SettingsPage";
import { OrdersPage } from "./OrdersPage";
import { InvoicesPage } from "./InvoicesPage";
import { ReportsPage } from "./ReportsPage";
import { DepartmentsPage } from "./DepartmentsPage";
import { CategoriesPage } from "./CategoriesPage";

interface POSLayoutProps {
  onLogout: () => void;
}

type PageType = "orders" | "menu" | "departments" | "categories" | "tables" | "invoices" | "reports" | "settings";

export function POSLayout({ onLogout }: POSLayoutProps) {
  const [currentPage, setCurrentPage] = useState<PageType>("orders");

  const navItems = [
    { id: "orders" as PageType, label: "Orders", icon: ShoppingCart },
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
      case "orders":
        return <OrdersPage />;
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
        return <OrdersPage />;
    }
  };

  return (
    <div className="flex size-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-600 to-pink-600 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-white">Restaurant POS</h1>
          <p className="text-purple-100 text-sm mt-1">Point of Sale System</p>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3">
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
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}

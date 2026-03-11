import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Bell, Sun, Moon, Plus, ShoppingCart, Package, Truck, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";

const breadcrumbMap: Record<string, { en: string; mm: string }> = {
  "/": { en: "Dashboard", mm: "ဒက်ရှ်ဘုတ်" },
  "/inventory": { en: "Inventory", mm: "သိုလှောင်ရုံ" },
  "/purchase-orders": { en: "Purchase Orders", mm: "မှာယူမှု" },
  "/shipments": { en: "Shipments", mm: "ပေးပို့မှု" },
  "/suppliers": { en: "Suppliers", mm: "ကုန်ပေးသူများ" },
  "/payments": { en: "Payments", mm: "ကျပ်ပေး" },
  "/reports": { en: "Reports", mm: "သတင်းအချက်" },
  "/settings": { en: "Settings", mm: "ဆက်တင်" },
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const currentPage = breadcrumbMap[location.pathname] || { en: "Page", mm: "" };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[60px] bg-card border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
            <nav className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Myanmar SCM</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium">{currentPage.en}</span>
              <span className="font-myanmar text-xs text-muted-foreground ml-1">({currentPage.mm})</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-md hover:bg-muted transition-colors">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="p-2 rounded-md hover:bg-muted relative transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l">
              <span className="text-xs text-muted-foreground">EN / <span className="font-myanmar">မြန်မာ</span></span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
            >
              {[
                { icon: ShoppingCart, label: "New Order", labelMm: "မှာယူမှုအသစ်", path: "/purchase-orders" },
                { icon: Package, label: "Add Item", labelMm: "ပစ္စည်းထည့်", path: "/inventory" },
                { icon: Truck, label: "New Shipment", labelMm: "ပေးပို့မှုအသစ်", path: "/shipments" },
              ].map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 bg-card shadow-lg rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors border"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.label}</span>
                  <span className="font-myanmar text-xs text-muted-foreground">{item.labelMm}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 ${
            fabOpen ? "rotate-45" : ""
          }`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

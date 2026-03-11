import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Truck, DollarSign, CreditCard, BarChart3, Settings, Menu, X, ChevronDown
} from "lucide-react";

const menuItems = [
  { path: "/", labelEn: "Dashboard", labelMm: "ဒက်ရှ်ဘုတ်", icon: LayoutDashboard },
  { path: "/inventory", labelEn: "Inventory", labelMm: "သိုလှောင်ရုံ", icon: Package },
  { path: "/purchase-orders", labelEn: "Purchase Orders", labelMm: "မှာယူမှု", icon: ShoppingCart },
  { path: "/shipments", labelEn: "Shipments", labelMm: "ပေးပို့မှု", icon: Truck },
  { path: "/suppliers", labelEn: "Suppliers", labelMm: "ကုန်ပေးသူများ", icon: DollarSign },
  { path: "/payments", labelEn: "Payments", labelMm: "ကျပ်ပေး", icon: CreditCard },
  { path: "/reports", labelEn: "Reports", labelMm: "သတင်းအချက်", icon: BarChart3 },
  { path: "/settings", labelEn: "Settings", labelMm: "ဆက်တင်", icon: Settings },
];

export default function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/80 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
              <Package className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Myanmar SCM</h1>
              <p className="text-[10px] opacity-70 font-myanmar">စီမံခန့်ခွဲမှု</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-accent-foreground" : ""}`} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.labelEn}</span>
                  <span className="text-[10px] font-myanmar opacity-60 truncate">{item.labelMm}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold">
              AM
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Admin Manager</p>
              <p className="text-[10px] opacity-60">admin@myanmarscm.mm</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

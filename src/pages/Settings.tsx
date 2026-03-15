import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Plus, X, Upload, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { settingsApi } from "@/lib/api";

const tabList = [
  { key: "company", label: "Company Profile", labelMm: "ကုမ္ပဏီပရိုဖိုင်" },
  { key: "users", label: "User Management", labelMm: "အသုံးပြုသူစီမံခန့်ခွဲမှု" },
  { key: "warehouses", label: "Warehouse Setup", labelMm: "ဂိုဒေါင်တည်ဆောက်မှု" },
  { key: "notifications", label: "Notifications", labelMm: "အကြောင်းကြားချက်" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companyData, usersData, warehousesData, notifData, permsData] = await Promise.all([
          settingsApi.getCompany(),
          settingsApi.getUsers(),
          settingsApi.getWarehouses(),
          settingsApi.getNotifications(),
          settingsApi.getPermissions(),
        ]);
        setCompany(companyData);
        setUsers(usersData);
        setWarehousesList(warehousesData);
        setNotifications(notifData);
        setPermissions(permsData);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveCompany = async () => {
    try {
      await settingsApi.updateCompany(company);
    } catch (err) {
      console.error("Failed to save company:", err);
    }
  };

  const handleSaveWarehouse = async () => {
    try {
      await settingsApi.createWarehouse({});
      setShowAddWarehouse(false);
      const data = await settingsApi.getWarehouses();
      setWarehousesList(data);
    } catch (err) {
      console.error("Failed to save warehouse:", err);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await settingsApi.updateNotifications(notifications);
    } catch (err) {
      console.error("Failed to save notifications:", err);
    }
  };

  const handleSavePermissions = async () => {
    try {
      await settingsApi.updatePermissions(permissions);
    } catch (err) {
      console.error("Failed to save permissions:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const companyFields = [
    { label: "Company Name", value: company?.name || "" },
    { label: "Phone", value: company?.phone || "" },
    { label: "Email", value: company?.email || "" },
    { label: "Address", value: company?.address || "" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground font-myanmar">ဆက်တင် - စနစ်ပြင်ဆင်ချက်များ</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabList.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-card shadow-sm" : "hover:bg-card/50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "company" && (
          <div className="card-elevated p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Company Logo</p>
                <p className="text-xs text-muted-foreground">Upload your company logo</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyFields.map((f) => (
                <div key={f.label}>
                  <label className="text-sm font-medium">{f.label}</label>
                  <input defaultValue={f.value} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select defaultValue={company?.currency || "MMK ကျပ်"} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  <option>MMK ကျပ်</option><option>USD</option><option>THB</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <select defaultValue={company?.language || "English / မြန်မာ"} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  <option>English / မြန်မာ</option><option>English</option><option>မြန်မာ</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Fiscal Year Start</label>
                <select defaultValue={company?.fiscalYearStart || "January"} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  {["January", "April", "July", "October"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleSaveCompany} className="gold-button flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="card-elevated overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Users</h3>
                <button className="gold-button text-sm flex items-center gap-1"><Plus className="w-3 h-3" /> Invite User</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Department</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.name} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{u.role}</span></td>
                      <td className="p-3 text-muted-foreground">{u.dept}</td>
                      <td className="p-3"><span className={`text-xs font-medium ${u.status === "active" ? "text-success" : "text-muted-foreground"}`}>● {u.status}</span></td>
                      <td className="p-3 text-xs text-muted-foreground font-mono-data">{u.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">Role Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium text-muted-foreground">Feature</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Admin</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Manager</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Staff</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p: any) => (
                      <tr key={p.feature} className="border-b last:border-0">
                        <td className="p-2">{p.feature}</td>
                        {[p.admin, p.manager, p.staff, p.viewer].map((v: boolean, i: number) => (
                          <td key={i} className="p-2 text-center"><input type="checkbox" defaultChecked={v} className="rounded" /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleSavePermissions} className="gold-button flex items-center gap-2 mt-4"><Save className="w-4 h-4" /> Save Permissions</button>
            </div>
          </div>
        )}

        {activeTab === "warehouses" && (
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Warehouses</h3>
              <button onClick={() => setShowAddWarehouse(true)} className="gold-button text-sm flex items-center gap-1"><Plus className="w-3 h-3" /> Add Warehouse</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Location</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Capacity</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Manager</th>
                </tr>
              </thead>
              <tbody>
                {warehousesList.map((w: any) => (
                  <tr key={w.name} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{w.name}</td>
                    <td className="p-3 text-muted-foreground">{w.location}</td>
                    <td className="p-3 text-muted-foreground">{w.capacity}</td>
                    <td className="p-3">{w.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="card-elevated p-6 space-y-6">
            <h3 className="font-semibold">Notification Preferences</h3>
            {notifications.map((n: any) => (
              <div key={n.label} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs font-myanmar text-muted-foreground">{n.labelMm}</p>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${n.email ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${n.email ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${n.sms ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${n.sms ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    SMS
                  </label>
                </div>
              </div>
            ))}
            <button onClick={handleSaveNotifications} className="gold-button flex items-center gap-2"><Save className="w-4 h-4" /> Save Preferences</button>
          </div>
        )}
      </motion.div>

      {/* Add Warehouse Modal */}
      <AnimatePresence>
        {showAddWarehouse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowAddWarehouse(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Add Warehouse</h2>
                <button onClick={() => setShowAddWarehouse(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {["Warehouse Name", "Location", "Capacity", "Manager"].map((f) => (
                  <div key={f}>
                    <label className="text-sm font-medium">{f}</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddWarehouse(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleSaveWarehouse} className="gold-button">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

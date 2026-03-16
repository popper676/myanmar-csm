import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Plus, X, Upload, Loader2, Pencil, Trash2, Check } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { settingsApi } from "@/lib/api";

const tabList = [
  { key: "company", label: "Company Profile", labelMm: "ကုမ္ပဏီပရိုဖိုင်" },
  { key: "users", label: "User Management", labelMm: "အသုံးပြုသူစီမံခန့်ခွဲမှု" },
  { key: "warehouses", label: "Warehouse Setup", labelMm: "ဂိုဒေါင်တည်ဆောက်မှု" },
  { key: "notifications", label: "Notifications", labelMm: "အကြောင်းကြားချက်" },
];

const ROLES = ['admin', 'manager', 'staff', 'viewer'] as const;

const emptyUser = { username: '', email: '', password: '', fullName: '', role: 'staff' as string, department: '' };
const emptyWarehouse = { name: '', location: '', capacity: '', manager: '' };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [company, setCompany] = useState({ name: '', phone: '', email: '', address: '', currency: 'MMK', language: 'en_mm', fiscalYearStart: 'January', logoPath: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState({ lowStockEmail: true, lowStockSms: false, newPoEmail: true, newPoSms: true, shipmentDelayedEmail: true, shipmentDelayedSms: true, paymentDueEmail: true, paymentDueSms: false });
  const [permissions, setPermissions] = useState<any[]>([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<string | null>(null);

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouse);
  const [deleteWarehouseConfirm, setDeleteWarehouseConfirm] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

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
        setCompany({
          name: companyData.name || '', phone: companyData.phone || '', email: companyData.email || '',
          address: companyData.address || '', currency: companyData.currency || 'MMK',
          language: companyData.language || 'en_mm', fiscalYearStart: companyData.fiscalYearStart || 'January',
          logoPath: companyData.logoPath || '',
        });
        setUsers(Array.isArray(usersData) ? usersData : []);
        setWarehousesList(Array.isArray(warehousesData) ? warehousesData : []);
        if (notifData && !Array.isArray(notifData)) {
          setNotifications({
            lowStockEmail: !!notifData.lowStockEmail, lowStockSms: !!notifData.lowStockSms,
            newPoEmail: !!notifData.newPoEmail, newPoSms: !!notifData.newPoSms,
            shipmentDelayedEmail: !!notifData.shipmentDelayedEmail, shipmentDelayedSms: !!notifData.shipmentDelayedSms,
            paymentDueEmail: !!notifData.paymentDueEmail, paymentDueSms: !!notifData.paymentDueSms,
          });
        }
        setPermissions(Array.isArray(permsData) ? permsData : []);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showSaved = (key: string) => {
    setSaveSuccess(key);
    setTimeout(() => setSaveSuccess(null), 2000);
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await settingsApi.updateCompany(company);
      showSaved('company');
    } catch (err) { console.error("Failed to save company:", err); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await settingsApi.uploadLogo(file);
      setCompany(c => ({ ...c, logoPath: result.logoPath }));
      showSaved('logo');
    } catch (err) { console.error("Failed to upload logo:", err); }
  };

  const openCreateUser = () => { setEditingUserId(null); setUserForm(emptyUser); setShowUserModal(true); };
  const openEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserForm({ username: u.username || '', email: u.email || '', password: '', fullName: u.fullName || u.full_name || '', role: u.role || 'staff', department: u.department || '' });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      if (editingUserId) {
        await settingsApi.updateUser(editingUserId, { fullName: userForm.fullName, role: userForm.role, department: userForm.department });
      } else {
        await settingsApi.createUser(userForm);
      }
      setShowUserModal(false);
      const data = await settingsApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
      showSaved('user');
    } catch (err) { console.error("Failed to save user:", err); }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await settingsApi.deleteUser(id);
      setDeleteUserConfirm(null);
      const data = await settingsApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to delete user:", err); }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const permsToSave: any[] = [];
      for (const p of permissions) {
        for (const role of ROLES) {
          permsToSave.push({ role, feature: p.feature, allowed: !!p[role] });
        }
      }
      await settingsApi.updatePermissions(permsToSave);
      showSaved('permissions');
    } catch (err) { console.error("Failed to save permissions:", err); }
    finally { setSaving(false); }
  };

  const togglePermission = (featureIdx: number, role: string) => {
    setPermissions(prev => prev.map((p, i) => i === featureIdx ? { ...p, [role]: !p[role] } : p));
  };

  const openCreateWarehouse = () => { setEditingWarehouseId(null); setWarehouseForm(emptyWarehouse); setShowWarehouseModal(true); };
  const openEditWarehouse = (w: any) => {
    setEditingWarehouseId(w.id);
    setWarehouseForm({ name: w.name || '', location: w.location || '', capacity: w.capacity || '', manager: w.manager || '' });
    setShowWarehouseModal(true);
  };

  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.location) return;
    setSaving(true);
    try {
      if (editingWarehouseId) {
        await settingsApi.updateWarehouse(editingWarehouseId, warehouseForm);
      } else {
        await settingsApi.createWarehouse(warehouseForm);
      }
      setShowWarehouseModal(false);
      const data = await settingsApi.getWarehouses();
      setWarehousesList(Array.isArray(data) ? data : []);
      showSaved('warehouse');
    } catch (err) { console.error("Failed to save warehouse:", err); }
    finally { setSaving(false); }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await settingsApi.deleteWarehouse(id);
      setDeleteWarehouseConfirm(null);
      const data = await settingsApi.getWarehouses();
      setWarehousesList(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to delete warehouse:", err); }
  };

  const toggleNotif = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsApi.updateNotifications(notifications);
      showSaved('notifications');
    } catch (err) { console.error("Failed to save notifications:", err); }
    finally { setSaving(false); }
  };

  const notifItems = [
    { key: 'lowStock', label: 'Low Stock Alert', labelMm: 'စတော့နည်းနေသည့်သတိပေးချက်', emailKey: 'lowStockEmail', smsKey: 'lowStockSms' },
    { key: 'newPo', label: 'New Purchase Order', labelMm: 'မှာယူလွှာအသစ်', emailKey: 'newPoEmail', smsKey: 'newPoSms' },
    { key: 'shipmentDelayed', label: 'Shipment Delayed', labelMm: 'ပေးပို့မှုနောက်ကျခြင်း', emailKey: 'shipmentDelayedEmail', smsKey: 'shipmentDelayedSms' },
    { key: 'paymentDue', label: 'Payment Due', labelMm: 'ငွေပေးချေရမည့်ရက်', emailKey: 'paymentDueEmail', smsKey: 'paymentDueSms' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">ဆက်တင် - စနစ်ပြင်ဆင်ချက်များ</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabList.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-card shadow-sm" : "hover:bg-card/50"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

        {/* ── COMPANY PROFILE ── */}
        {activeTab === "company" && (
          <div className="card-elevated p-6 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              >
                {company.logoPath ? (
                  <img src={company.logoPath} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">Company Logo</p>
                <p className="text-xs text-muted-foreground">Click to upload (JPG, PNG, SVG, WebP)</p>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <input value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select value={company.currency} onChange={e => setCompany(c => ({ ...c, currency: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="MMK">MMK ကျပ်</option>
                  <option value="USD">USD</option>
                  <option value="THB">THB</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <select value={company.language} onChange={e => setCompany(c => ({ ...c, language: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  <option value="en_mm">English / မြန်မာ</option>
                  <option value="en">English</option>
                  <option value="mm">မြန်မာ</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Fiscal Year Start</label>
                <select value={company.fiscalYearStart} onChange={e => setCompany(c => ({ ...c, fiscalYearStart: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                  {["January", "April", "July", "October"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleSaveCompany} disabled={saving} className="gold-button flex items-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess === 'company' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess === 'company' ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {activeTab === "users" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="card-elevated overflow-hidden">
              <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base">Users</h3>
                <button onClick={openCreateUser} className="gold-button text-xs sm:text-sm flex items-center gap-1"><Plus className="w-3 h-3" /> Invite User</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Username</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Last Login</th>
                      <th className="p-3 text-center font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{u.fullName || u.full_name}</td>
                        <td className="p-3 text-muted-foreground text-xs font-mono-data">{u.username}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{u.role}</span></td>
                        <td className="p-3"><span className={`text-xs font-medium ${u.status === "active" ? "text-success" : "text-muted-foreground"}`}>● {u.status}</span></td>
                        <td className="p-3 text-xs text-muted-foreground font-mono-data">{u.lastLogin || u.last_login || '—'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditUser(u)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteUserConfirm(u.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">Role Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium text-muted-foreground">Feature</th>
                      {ROLES.map(r => <th key={r} className="p-2 text-center font-medium text-muted-foreground capitalize">{r}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p: any, idx: number) => (
                      <tr key={p.feature} className="border-b last:border-0">
                        <td className="p-2">{p.feature}</td>
                        {ROLES.map((role) => (
                          <td key={role} className="p-2 text-center">
                            <input type="checkbox" checked={!!p[role]} onChange={() => togglePermission(idx, role)} className="rounded cursor-pointer" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleSavePermissions} disabled={saving} className="gold-button flex items-center gap-2 mt-4 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess === 'permissions' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess === 'permissions' ? 'Saved!' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}

        {/* ── WAREHOUSES ── */}
        {activeTab === "warehouses" && (
          <div className="card-elevated overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base">Warehouses</h3>
              <button onClick={openCreateWarehouse} className="gold-button text-xs sm:text-sm flex items-center gap-1"><Plus className="w-3 h-3" /> Add Warehouse</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Location</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Capacity</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Manager</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehousesList.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No warehouses yet</td></tr>
                  ) : warehousesList.map((w: any) => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{w.name}</td>
                      <td className="p-3 text-muted-foreground">{w.location}</td>
                      <td className="p-3 text-muted-foreground">{w.capacity}</td>
                      <td className="p-3">{w.manager}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditWarehouse(w)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteWarehouseConfirm(w.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <div className="card-elevated p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h3 className="font-semibold text-sm sm:text-base">Notification Preferences</h3>
            {notifItems.map((n) => (
              <div key={n.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-[10px] sm:text-xs font-myanmar text-muted-foreground">{n.labelMm}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => toggleNotif(n.emailKey)}>
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${notifications[n.emailKey as keyof typeof notifications] ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${notifications[n.emailKey as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => toggleNotif(n.smsKey)}>
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${notifications[n.smsKey as keyof typeof notifications] ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${notifications[n.smsKey as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    SMS
                  </label>
                </div>
              </div>
            ))}
            <button onClick={handleSaveNotifications} disabled={saving} className="gold-button flex items-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess === 'notifications' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess === 'notifications' ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        )}
      </motion.div>

      {/* ── USER MODAL ── */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowUserModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editingUserId ? 'Edit User' : 'Invite User'}</h2>
                <button onClick={() => setShowUserModal(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input value={userForm.fullName} onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {!editingUserId && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Username *</label>
                        <input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email *</label>
                        <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Min 8 chars, uppercase, lowercase, number, special" />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <input value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowUserModal(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleSaveUser} disabled={saving} className="gold-button flex items-center gap-2 disabled:opacity-70">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUserId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE USER CONFIRM ── */}
      <AnimatePresence>
        {deleteUserConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setDeleteUserConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Delete User</h3>
              <p className="text-sm text-muted-foreground mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteUserConfirm(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={() => handleDeleteUser(deleteUserConfirm)} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WAREHOUSE MODAL ── */}
      <AnimatePresence>
        {showWarehouseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowWarehouseModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">{editingWarehouseId ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
                <button onClick={() => setShowWarehouseModal(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Warehouse Name *</label>
                  <input value={warehouseForm.name} onChange={e => setWarehouseForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium">Location *</label>
                  <input value={warehouseForm.location} onChange={e => setWarehouseForm(f => ({ ...f, location: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    <input value={warehouseForm.capacity} onChange={e => setWarehouseForm(f => ({ ...f, capacity: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="e.g., 10,000 sqft" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Manager</label>
                    <input value={warehouseForm.manager} onChange={e => setWarehouseForm(f => ({ ...f, manager: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowWarehouseModal(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleSaveWarehouse} disabled={saving} className="gold-button flex items-center gap-2 disabled:opacity-70">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingWarehouseId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE WAREHOUSE CONFIRM ── */}
      <AnimatePresence>
        {deleteWarehouseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setDeleteWarehouseConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Delete Warehouse</h3>
              <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this warehouse?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteWarehouseConfirm(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={() => handleDeleteWarehouse(deleteWarehouseConfirm)} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

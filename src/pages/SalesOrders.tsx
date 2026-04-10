import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, ShoppingBag } from "lucide-react";
import { inventoryApi, salesOrderApi } from "@/lib/api";

const formatMMK = (amount: number): string => `${Number(amount || 0).toLocaleString()} ကျပ်`;

export default function SalesOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    orderDate: new Date().toISOString().slice(0, 10),
    notes: "",
    items: [{ inventoryItemId: "", qty: 1, unitPrice: 0 }],
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [soData, invData] = await Promise.all([
        salesOrderApi.list(),
        inventoryApi.list({ limit: "200" }),
      ]);
      setOrders(Array.isArray(soData) ? soData : soData.orders || []);
      const inv = Array.isArray(invData) ? invData : invData.items || [];
      setInventoryItems(inv);
    } catch (e: any) {
      setError(e.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const total = useMemo(
    () =>
      form.items.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0),
    [form.items],
  );

  const onItemPick = (idx: number, inventoryItemId: string) => {
    const inv = inventoryItems.find((i) => i.id === inventoryItemId);
    const next = [...form.items];
    next[idx] = {
      ...next[idx],
      inventoryItemId,
      unitPrice: inv?.unitPrice || 0,
    };
    setForm((f) => ({ ...f, items: next }));
  };

  const addLine = () => setForm((f) => ({ ...f, items: [...f.items, { inventoryItemId: "", qty: 1, unitPrice: 0 }] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const createOrder = async () => {
    setError(null);
    if (!form.customerName.trim()) return setError("Customer name is required");
    const validItems = form.items.filter((i) => i.inventoryItemId && i.qty > 0);
    if (validItems.length === 0) return setError("Add at least one item");

    setCreating(true);
    try {
      await salesOrderApi.create({
        customerName: form.customerName,
        orderDate: form.orderDate,
        notes: form.notes || undefined,
        items: validItems,
      });
      setForm({
        customerName: "",
        orderDate: new Date().toISOString().slice(0, 10),
        notes: "",
        items: [{ inventoryItemId: "", qty: 1, unitPrice: 0 }],
      });
      await fetchData();
    } catch (e: any) {
      setError(e.message || "Failed to create sales order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Sales Orders</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Inventory-linked sales processing (SO → Inventory Out → Accounting)
        </p>
      </div>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">{error}</div>}

      <div className="card-elevated p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Sales Order</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Customer name"
            className="px-3 py-2 rounded border bg-card text-sm"
          />
          <input
            type="date"
            value={form.orderDate}
            onChange={(e) => setForm((f) => ({ ...f, orderDate: e.target.value }))}
            className="px-3 py-2 rounded border bg-card text-sm"
          />
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            className="px-3 py-2 rounded border bg-card text-sm"
          />
        </div>

        <div className="space-y-2">
          {form.items.map((line, idx) => {
            const inv = inventoryItems.find((i) => i.id === line.inventoryItemId);
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={line.inventoryItemId}
                  onChange={(e) => onItemPick(idx, e.target.value)}
                  className="col-span-12 md:col-span-6 px-3 py-2 rounded border bg-card text-sm"
                >
                  <option value="">Select inventory item</option>
                  {inventoryItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.sku} - {it.nameEn} (stock: {it.quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) => {
                    const next = [...form.items];
                    next[idx].qty = Number(e.target.value) || 0;
                    setForm((f) => ({ ...f, items: next }));
                  }}
                  className="col-span-4 md:col-span-2 px-3 py-2 rounded border bg-card text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={line.unitPrice}
                  onChange={(e) => {
                    const next = [...form.items];
                    next[idx].unitPrice = Number(e.target.value) || 0;
                    setForm((f) => ({ ...f, items: next }));
                  }}
                  className="col-span-5 md:col-span-2 px-3 py-2 rounded border bg-card text-sm"
                />
                <button
                  onClick={() => removeLine(idx)}
                  disabled={form.items.length === 1}
                  className="col-span-3 md:col-span-2 px-3 py-2 rounded border text-sm hover:bg-muted disabled:opacity-50"
                >
                  Remove
                </button>
                {inv && line.qty > 0 && line.qty > Number(inv.quantity) && (
                  <div className="col-span-12 text-xs text-destructive">
                    Insufficient stock for {inv.nameEn}. Available: {inv.quantity}, Requested: {line.qty}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button onClick={addLine} className="px-3 py-2 rounded border text-sm hover:bg-muted w-fit">+ Add Line</button>
          <div className="text-sm font-semibold">Estimated Total: {formatMMK(total)}</div>
        </div>

        <button
          onClick={createOrder}
          disabled={creating}
          className="gold-button text-sm flex items-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          Process Sales Order
        </button>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left">SO Number</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No sales orders yet</td></tr>
                ) : orders.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="p-3 font-mono-data text-xs">{o.soNumber}</td>
                    <td className="p-3">{o.customerName}</td>
                    <td className="p-3">{o.orderDate}</td>
                    <td className="p-3 text-right">{formatMMK(o.totalAmount)}</td>
                    <td className="p-3 text-center">{o.itemsCount}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        o.status === "fulfilled" ? "status-badge-delivered" : o.status === "cancelled" ? "status-badge-cancelled" : "status-badge-confirmed"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

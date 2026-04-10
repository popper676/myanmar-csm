import { useEffect, useState } from "react";
import { Loader2, Receipt, Search } from "lucide-react";
import { invoiceApi } from "@/lib/api";

const formatMMK = (amount: number): string => `${Number(amount || 0).toLocaleString()} ကျပ်`;

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.list(search ? { search } : undefined);
      setInvoices(Array.isArray(data) ? data : data.invoices || []);
      setSummary(data.summary || { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Customer billing and receivables tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground">Total Invoiced</p>
          <p className="text-lg font-bold mt-1">{formatMMK(summary.totalInvoiced)}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-lg font-bold mt-1">{formatMMK(summary.totalCollected)}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-bold mt-1">{formatMMK(summary.totalOutstanding)}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices..."
          className="w-full pl-10 pr-4 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
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
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">SO Number</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Issue Date</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        No invoices yet
                      </div>
                    </td>
                  </tr>
                ) : invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="p-3 font-mono-data text-xs">{inv.invoiceNumber}</td>
                    <td className="p-3 font-mono-data text-xs">{inv.soNumber || "-"}</td>
                    <td className="p-3">{inv.customerName}</td>
                    <td className="p-3">{inv.issueDate}</td>
                    <td className="p-3 text-right">{formatMMK(inv.totalAmount)}</td>
                    <td className="p-3 text-right">{formatMMK(inv.paidAmount)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === "paid" ? "status-badge-delivered" : inv.status === "partial" ? "status-badge-confirmed" : inv.status === "cancelled" ? "status-badge-cancelled" : "status-badge-pending"
                      }`}>
                        {inv.status}
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

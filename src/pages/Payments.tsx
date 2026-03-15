import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, ArrowUpRight, ArrowDownRight, Search, Download, Loader2 } from "lucide-react";
import { paymentApi } from "@/lib/api";

const formatMMK = (amount: number): string => `${amount.toLocaleString()} ကျပ်`;

const statusStyle: Record<string, string> = {
  completed: "status-badge-delivered",
  pending: "status-badge-pending",
  failed: "status-badge-cancelled",
};

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = await paymentApi.list(params);
      if (data.summary) setSummary(data.summary);
      setPayments(data.payments || data);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search]);

  const handleExport = async () => {
    try {
      const csv = await paymentApi.exportCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payments.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  const defaultSummary = [
    { label: "Total Paid This Month", labelMm: "ယခုလပေးချေပြီး", value: "၃၂,၆၀၀,၀၀၀ ကျပ်", change: "+18%", up: true },
    { label: "Pending Payments", labelMm: "ဆိုင်းငံ့ငွေပေးချေမှု", value: "၁၅,၇၅၀,၀၀၀ ကျပ်", change: "2 payments", up: false },
    { label: "Overdue Payments", labelMm: "သတ်မှတ်ရက်ကျော်", value: "၄,၅၀၀,၀၀၀ ကျပ်", change: "1 payment", up: true },
  ];

  const summaryCards = summary.length > 0 ? summary : defaultSummary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground font-myanmar">ကျပ်ပေး စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted"><Download className="w-4 h-4" /> Export</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((s: any, i: number) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-elevated p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-xs font-myanmar text-muted-foreground">{s.labelMm}</p>
            <p className="text-xl font-bold mt-2">{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {s.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <CreditCard className="w-3 h-3 text-warning-dark" />}
              <span className="text-xs text-muted-foreground">{s.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments..." className="w-full pl-10 pr-4 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Payments Table */}
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
                <th className="p-3 text-left font-medium text-muted-foreground">Payment ID</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Amount (MMK)</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Reference</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payments found</td></tr>
              ) : payments.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono-data text-xs">{p.id}</td>
                  <td className="p-3">{p.supplier}</td>
                  <td className="p-3 text-muted-foreground">{p.date}</td>
                  <td className="p-3 text-right font-mono-data">{formatMMK(p.amount)}</td>
                  <td className="p-3 text-muted-foreground">{p.method}</td>
                  <td className="p-3 font-mono-data text-xs text-muted-foreground">{p.ref}</td>
                  <td className="p-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[p.status]}`}>{p.status}</span></td>
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

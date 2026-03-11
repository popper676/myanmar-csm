import { motion } from "framer-motion";
import { CreditCard, ArrowUpRight, ArrowDownRight, Search, Download } from "lucide-react";
import { formatMMK } from "@/data/dummy-data";

const payments = [
  { id: "PAY-001", supplier: "Myanmar Rice Corp", date: "2024-01-15", amount: 12500000, method: "Bank Transfer", status: "completed", ref: "KBZ-TXN-001" },
  { id: "PAY-002", supplier: "Shwe Yadanar Trading", date: "2024-01-14", amount: 8750000, method: "Check", status: "pending", ref: "CHK-2024-002" },
  { id: "PAY-003", supplier: "Amarapura Textiles", date: "2024-01-12", amount: 6800000, method: "Bank Transfer", status: "completed", ref: "AYA-TXN-003" },
  { id: "PAY-004", supplier: "Delta Fisheries", date: "2024-01-10", amount: 2100000, method: "Cash", status: "completed", ref: "CASH-004" },
  { id: "PAY-005", supplier: "Shan Tea Garden", date: "2024-01-08", amount: 4500000, method: "Bank Transfer", status: "failed", ref: "CB-TXN-005" },
  { id: "PAY-006", supplier: "KBZ Wholesale", date: "2024-01-06", amount: 3200000, method: "Mobile Banking", status: "completed", ref: "WAVE-006" },
  { id: "PAY-007", supplier: "Mon Rubber Co", date: "2024-01-04", amount: 7000000, method: "Bank Transfer", status: "pending", ref: "KBZ-TXN-007" },
];

const statusStyle: Record<string, string> = {
  completed: "status-badge-delivered",
  pending: "status-badge-pending",
  failed: "status-badge-cancelled",
};

export default function Payments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground font-myanmar">ကျပ်ပေး စီမံခန့်ခွဲမှု</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted"><Download className="w-4 h-4" /> Export</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Paid This Month", labelMm: "ယခုလပေးချေပြီး", value: "၃၂,၆၀၀,၀၀၀ ကျပ်", change: "+18%", up: true },
          { label: "Pending Payments", labelMm: "ဆိုင်းငံ့ငွေပေးချေမှု", value: "၁၅,၇၅၀,၀၀၀ ကျပ်", change: "2 payments", up: false },
          { label: "Overdue Payments", labelMm: "သတ်မှတ်ရက်ကျော်", value: "၄,၅၀၀,၀၀၀ ကျပ်", change: "1 payment", up: true },
        ].map((s, i) => (
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
        <input placeholder="Search payments..." className="w-full pl-10 pr-4 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Payments Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
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
              {payments.map((p) => (
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
        </div>
      </div>
    </div>
  );
}

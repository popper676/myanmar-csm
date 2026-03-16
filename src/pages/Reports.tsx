import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Calendar, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { reportApi } from "@/lib/api";

const formatMMK = (amount: number): string => `${amount.toLocaleString()} ကျပ်`;

const PIE_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))',
  'hsl(var(--info))', 'hsl(var(--warning-dark))', 'hsl(var(--destructive))',
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042',
];

const reportCards = [
  { title: "Inventory Valuation Report", titleMm: "သိုလှောင်ရုံတန်ဖိုးအစီရင်ခံစာ", icon: FileText },
  { title: "Purchase Order Summary", titleMm: "မှာယူမှုအနှစ်ချုပ်", icon: FileText },
  { title: "Supplier Performance Report", titleMm: "ကုန်ပေးသူစွမ်းဆောင်ရည်", icon: FileText },
  { title: "Stock Movement Report", titleMm: "စတော့ရွေ့လျားမှု", icon: FileText },
];

const dateRanges = ["This Week", "This Month", "This Quarter", "Custom"];

export default function Reports() {
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState<any[]>([]);
  const [turnoverData, setTurnoverData] = useState<any[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [movingProducts, setMovingProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [summary, turnover, cost, moving] = await Promise.all([
          reportApi.summary(),
          reportApi.turnover(),
          reportApi.costBreakdown(),
          reportApi.movingProducts(),
        ]);
        if (Array.isArray(summary)) {
          setSummaryStats(summary);
        } else {
          setSummaryStats([
            { label: "Total Purchases", labelMm: "စုစုပေါင်းဝယ်ယူမှု", value: formatMMK(summary.totalPurchases || 0) },
            { label: "Active Suppliers", labelMm: "လက်ရှိကုန်ပေးသူ", value: String(summary.activeSuppliers || 0) },
            { label: "Inventory Accuracy", labelMm: "သိုလှောင်ရုံတိကျမှု", value: `${summary.inventoryAccuracy || 0}%` },
          ]);
        }
        setTurnoverData(Array.isArray(turnover) ? turnover : []);
        const costArr = Array.isArray(cost) ? cost : [];
        setCostBreakdown(costArr.map((c: any, i: number) => ({ ...c, color: c.color || PIE_COLORS[i % PIE_COLORS.length] })));
        setMovingProducts(Array.isArray(moving) ? moving : []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">သတင်းအချက်အလက် အစီရင်ခံစာ</p>
        </div>
        <div className="flex gap-2 self-start">
          <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border text-xs sm:text-sm hover:bg-muted"><Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Export to</span> PDF</button>
          <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border text-xs sm:text-sm hover:bg-muted"><Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Export to</span> Excel</button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap gap-2">
        {dateRanges.map((d) => (
          <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === d ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{d}</button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {summaryStats.map((stat: any, i: number) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-elevated p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-[10px] sm:text-xs font-myanmar text-muted-foreground">{stat.labelMm}</p>
            <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {reportCards.map((r, i) => (
          <motion.div key={r.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} className="card-elevated p-3 sm:p-5 cursor-pointer hover:border-accent/50 transition-colors">
            <r.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3" />
            <h3 className="font-semibold text-xs sm:text-sm">{r.title}</h3>
            <p className="text-[10px] sm:text-xs font-myanmar text-muted-foreground mt-1 hidden sm:block">{r.titleMm}</p>
            <button className="text-[10px] sm:text-xs text-accent font-medium mt-2 sm:mt-3 hover:underline">Generate →</button>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Inventory Turnover */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-3 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base mb-1">Inventory Turnover Rate</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">သိုလှောင်ရုံလည်ပတ်နှုန်း</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={35} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-elevated p-3 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base mb-1">Cost Breakdown by Category</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">အမျိုးအစားအလိုက်ကုန်ကျစရိတ်</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {costBreakdown.map((entry: any) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Fast/Slow Moving */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-elevated p-3 sm:p-5">
        <h3 className="font-semibold text-sm sm:text-base mb-1">Top 10 Fast vs Slow Moving Products</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">အမြန်/နှေးကွေးရောင်းချမှု ထုတ်ကုန်များ</p>
        <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
          <div className="min-w-[400px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={movingProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fast" name="Fast Moving" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="slow" name="Slow Moving" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatMMK } from "@/data/dummy-data";

const turnoverData = [
  { month: "Aug", rate: 3.2 }, { month: "Sep", rate: 2.8 }, { month: "Oct", rate: 4.1 },
  { month: "Nov", rate: 3.5 }, { month: "Dec", rate: 4.8 }, { month: "Jan", rate: 5.2 },
];

const movingProducts = [
  { name: "Jasmine Rice", fast: 5000, slow: 0 },
  { name: "Cheroot Cigars", fast: 2000, slow: 0 },
  { name: "Shrimp Paste", fast: 800, slow: 0 },
  { name: "Lacquerware", fast: 0, slow: 60 },
  { name: "Silk Fabric", fast: 0, slow: 25 },
  { name: "Teak Wood", fast: 0, slow: 120 },
  { name: "Green Tea", fast: 1500, slow: 0 },
  { name: "Cooking Oil", fast: 200, slow: 0 },
  { name: "Betel Nut", fast: 0, slow: 45 },
  { name: "Rubber", fast: 0, slow: 2000 },
];

const costBreakdown = [
  { name: "Food", value: 45, color: "hsl(var(--primary))" },
  { name: "Textile", value: 20, color: "hsl(var(--accent))" },
  { name: "Raw Material", value: 18, color: "hsl(var(--info))" },
  { name: "Handicraft", value: 10, color: "hsl(var(--success))" },
  { name: "Spices", value: 7, color: "hsl(var(--destructive))" },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground font-myanmar">သတင်းအချက်အလက် အစီရင်ခံစာ</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted"><Download className="w-4 h-4" /> Export to PDF</button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted"><Download className="w-4 h-4" /> Export to Excel</button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap gap-2">
        {dateRanges.map((d) => (
          <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === d ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{d}</button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Purchases This Month", labelMm: "ယခုလဝယ်ယူမှုစုစုပေါင်း", value: "၆၇,၈၅၀,၀၀၀ ကျပ်" },
          { label: "Active Suppliers", labelMm: "လက်ရှိကုန်ပေးသူ", value: "14" },
          { label: "Inventory Accuracy", labelMm: "သိုလှောင်ရုံတိကျမှု", value: "96.8%" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-elevated p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xs font-myanmar text-muted-foreground">{stat.labelMm}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r, i) => (
          <motion.div key={r.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} className="card-elevated p-5 cursor-pointer hover:border-accent/50 transition-colors">
            <r.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-sm">{r.title}</h3>
            <p className="text-xs font-myanmar text-muted-foreground mt-1">{r.titleMm}</p>
            <button className="text-xs text-accent font-medium mt-3 hover:underline">Generate →</button>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inventory Turnover */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-5">
          <h3 className="font-semibold mb-1">Inventory Turnover Rate</h3>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">သိုလှောင်ရုံလည်ပတ်နှုန်း</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-elevated p-5">
          <h3 className="font-semibold mb-1">Cost Breakdown by Category</h3>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">အမျိုးအစားအလိုက်ကုန်ကျစရိတ်</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {costBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Fast/Slow Moving */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-elevated p-5">
        <h3 className="font-semibold mb-1">Top 10 Fast vs Slow Moving Products</h3>
        <p className="text-xs text-muted-foreground font-myanmar mb-4">အမြန်/နှေးကွေးရောင်းချမှု ထုတ်ကုန်များ</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={movingProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Legend />
            <Bar dataKey="fast" name="Fast Moving" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
            <Bar dataKey="slow" name="Slow Moving" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

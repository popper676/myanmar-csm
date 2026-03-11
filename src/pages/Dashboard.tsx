import { motion } from "framer-motion";
import { Package, ShoppingCart, Truck, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMMK, formatMMKShort, monthlySalesData, topProductsData, recentOrders, lowStockItems, type OrderStatus } from "@/data/dummy-data";

const kpis = [
  { labelEn: "Total Inventory Value", labelMm: "စုစုပေါင်းတန်ဖိုး", value: "၁၂၅,၄၅၀,၀၀၀ ကျပ်", rawValue: "125,450,000 MMK", icon: Package, change: "+12%", up: true, color: "text-primary" },
  { labelEn: "Pending Orders", labelMm: "ဆိုင်းငံ့မှာယူမှု", value: "23", icon: ShoppingCart, change: "+5", up: true, color: "text-info" },
  { labelEn: "Shipments In Transit", labelMm: "ပို့ဆောင်ဆဲ", value: "8", icon: Truck, change: "-2", up: false, color: "text-accent" },
  { labelEn: "Low Stock Alerts", labelMm: "စတော့နည်းနေသည်", value: "5", icon: AlertTriangle, change: "+3", up: true, color: "text-destructive", badge: true },
];

const statusColors: Record<OrderStatus, string> = {
  pending: "status-badge-pending",
  confirmed: "status-badge-confirmed",
  delivered: "status-badge-delivered",
  cancelled: "status-badge-cancelled",
  approved: "status-badge-confirmed",
  received: "status-badge-delivered",
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-myanmar">ဒက်ရှ်ဘုတ် - လုပ်ငန်းခြုံငုံသုံးသပ်ချက်</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.labelEn}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariant}
            className="card-elevated p-5 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{kpi.labelEn}</p>
                <p className="text-xs font-myanmar text-muted-foreground">{kpi.labelMm}</p>
              </div>
              <div className={`p-2 rounded-md bg-muted ${kpi.color} relative`}>
                <kpi.icon className="w-4 h-4" />
                {kpi.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                    {kpi.value}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-mono-data">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                <span className={`text-xs font-medium ${kpi.up ? "text-success" : "text-destructive"}`}>{kpi.change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-5">
          <h3 className="font-semibold mb-1">Monthly Sales Trend</h3>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">လစဉ်ရောင်းချမှုလမ်းကြောင်း</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => [formatMMK(value), "Sales"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 4, strokeWidth: 2, stroke: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-5">
          <h3 className="font-semibold mb-1">Top 5 Products by Quantity</h3>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">ထိပ်တန်းထုတ်ကုန် ၅ ခု</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-5 lg:col-span-2">
          <h3 className="font-semibold mb-1">Recent Orders</h3>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">မကြာသေးမီ မှာယူမှုများ</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-3 font-medium text-muted-foreground">Supplier</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Amount (MMK)</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-mono-data text-xs">{order.poNumber}</td>
                    <td className="py-3">{order.supplier}</td>
                    <td className="py-3 text-muted-foreground">{order.orderDate}</td>
                    <td className="py-3 text-right font-mono-data">{formatMMK(order.totalAmount)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-elevated p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold">Low Stock Alerts</h3>
          </div>
          <p className="text-xs text-muted-foreground font-myanmar mb-4">စတော့နည်းနေသောပစ္စည်းများ</p>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                <div>
                  <p className="text-sm font-medium">{item.nameEn}</p>
                  <p className="text-xs font-myanmar text-muted-foreground">{item.nameMm}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono-data font-bold ${item.stockStatus === 'critical' ? 'stock-critical' : 'stock-low'}`}>
                    {item.quantity} {item.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

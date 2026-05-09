'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  IndianRupee,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const revenueExpenseData = [
  { month: 'Jul', revenue: 85000, expenses: 32000 },
  { month: 'Aug', revenue: 92000, expenses: 28000 },
  { month: 'Sep', revenue: 78000, expenses: 35000 },
  { month: 'Oct', revenue: 110000, expenses: 40000 },
  { month: 'Nov', revenue: 95000, expenses: 33000 },
  { month: 'Dec', revenue: 124500, expenses: 38000 },
]

const pieData = [
  { name: 'Paid', value: 65, color: '#10b981' },
  { name: 'Pending', value: 22, color: '#f59e0b' },
  { name: 'Overdue', value: 13, color: '#ef4444' },
]

const monthlyComparison = [
  { month: 'Jul', thisYear: 85000, lastYear: 72000 },
  { month: 'Aug', thisYear: 92000, lastYear: 68000 },
  { month: 'Sep', thisYear: 78000, lastYear: 75000 },
  { month: 'Oct', thisYear: 110000, lastYear: 85000 },
  { month: 'Nov', thisYear: 95000, lastYear: 88000 },
  { month: 'Dec', thisYear: 124500, lastYear: 95000 },
]

const topClients = [
  { name: 'Priya Sharma', revenue: 57500, invoices: 2 },
  { name: 'Sneha Patil', revenue: 45000, invoices: 1 },
  { name: 'Rajesh Kumar', revenue: 48000, invoices: 3 },
  { name: 'Vikram Singh', revenue: 12300, invoices: 1 },
  { name: 'Neha Gupta', revenue: 9800, invoices: 1 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('this-month')

  const overviewCards = [
    {
      title: 'Total Revenue',
      value: '₹1,24,500',
      change: '+18.2%',
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Avg Invoice Value',
      value: '₹16,716',
      change: '+5.4%',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Collection Rate',
      value: '98.5%',
      change: '+2.1%',
      icon: CheckCircle2,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your business performance and insights.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">{card.change}</span>
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{card.title}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue vs Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueExpenseData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Year-over-Year Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="thisYear" fill="#10b981" radius={[4, 4, 0, 0]} name="This Year" />
                  <Bar dataKey="lastYear" fill="#d1d5db" radius={[4, 4, 0, 0]} name="Last Year" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Invoices</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, i) => (
                  <tr key={client.name} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="py-3 pr-4 text-sm font-medium">{client.name}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{client.invoices}</td>
                    <td className="py-3 text-right text-sm font-semibold text-emerald-600">
                      ₹{client.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

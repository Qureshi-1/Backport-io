'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  FileSpreadsheet,
  Eye,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { month: 'Jul', revenue: 85000, expenses: 32000 },
  { month: 'Aug', revenue: 92000, expenses: 28000 },
  { month: 'Sep', revenue: 78000, expenses: 35000 },
  { month: 'Oct', revenue: 110000, expenses: 40000 },
  { month: 'Nov', revenue: 95000, expenses: 33000 },
  { month: 'Dec', revenue: 124500, expenses: 38000 },
]

const monthlyData = [
  { name: 'Jul', invoices: 8, paid: 6 },
  { name: 'Aug', invoices: 12, paid: 10 },
  { name: 'Sep', invoices: 7, paid: 5 },
  { name: 'Oct', invoices: 15, paid: 13 },
  { name: 'Nov', invoices: 11, paid: 9 },
  { name: 'Dec', invoices: 14, paid: 12 },
]

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  total: number
  status: string
  dueDate: string
  createdAt: string
}

const demoInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', clientName: 'Rajesh Kumar', total: 15000, status: 'paid', dueDate: '2024-12-15', createdAt: '2024-12-01' },
  { id: '2', invoiceNumber: 'INV-002', clientName: 'Priya Sharma', total: 25000, status: 'pending', dueDate: '2024-12-20', createdAt: '2024-12-05' },
  { id: '3', invoiceNumber: 'INV-003', clientName: 'Amit Mehta', total: 8200, status: 'overdue', dueDate: '2024-12-10', createdAt: '2024-11-25' },
  { id: '4', invoiceNumber: 'INV-004', clientName: 'Sneha Patil', total: 45000, status: 'paid', dueDate: '2024-12-18', createdAt: '2024-12-03' },
  { id: '5', invoiceNumber: 'INV-005', clientName: 'Vikram Singh', total: 12300, status: 'sent', dueDate: '2024-12-25', createdAt: '2024-12-10' },
]

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

export default function DashboardHome() {
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices)

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setInvoices(data.slice(0, 5))
        }
      })
      .catch(() => {})
  }, [])

  const stats = [
    { title: 'Total Revenue', value: '₹1,24,500', change: '+12.5%', icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { title: 'Pending Amount', value: '₹45,200', change: '8 invoices', icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50' },
    { title: 'Paid This Month', value: '23', change: '+4 vs last month', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
    { title: 'Active Clients', value: '42', change: '+3 new', icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, John! 👋</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your invoices.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {stat.change && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.title}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="invoices" fill="#10b981" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="paid" fill="#6ee7b7" radius={[4, 4, 0, 0]} name="Paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
          <Button variant="ghost" size="sm" className="text-emerald-600">
            View All
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Invoice</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Due Date</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm">{invoice.clientName}</td>
                    <td className="py-3 pr-4 text-sm font-medium">₹{invoice.total.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={statusColors[invoice.status] || ''}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{invoice.dueDate}</td>
                    <td className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

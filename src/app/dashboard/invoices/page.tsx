'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  FileSpreadsheet,
  MoreHorizontal,
  Eye,
  Trash2,
  IndianRupee,
  AlertCircle,
  Filter,
  X,
  Minus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientId: string
  total: number
  subtotal: number
  taxRate: number
  taxAmount: number
  status: string
  dueDate: string
  createdAt: string
  notes?: string
  items?: InvoiceItem[]
}

const demoInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', clientName: 'Rajesh Kumar', clientId: 'c1', total: 15000, subtotal: 12712, taxRate: 18, taxAmount: 2288, status: 'paid', dueDate: '2024-12-15', createdAt: '2024-12-01', notes: 'Thank you for your business!' },
  { id: '2', invoiceNumber: 'INV-002', clientName: 'Priya Sharma', clientId: 'c2', total: 25000, subtotal: 21186, taxRate: 18, taxAmount: 3814, status: 'pending', dueDate: '2024-12-20', createdAt: '2024-12-05' },
  { id: '3', invoiceNumber: 'INV-003', clientName: 'Amit Mehta', clientId: 'c3', total: 8200, subtotal: 6949, taxRate: 18, taxAmount: 1251, status: 'overdue', dueDate: '2024-12-10', createdAt: '2024-11-25' },
  { id: '4', invoiceNumber: 'INV-004', clientName: 'Sneha Patil', clientId: 'c4', total: 45000, subtotal: 38136, taxRate: 18, taxAmount: 6864, status: 'paid', dueDate: '2024-12-18', createdAt: '2024-12-03' },
  { id: '5', invoiceNumber: 'INV-005', clientName: 'Vikram Singh', clientId: 'c5', total: 12300, subtotal: 10424, taxRate: 18, taxAmount: 1876, status: 'sent', dueDate: '2024-12-25', createdAt: '2024-12-10' },
  { id: '6', invoiceNumber: 'INV-006', clientName: 'Rajesh Kumar', clientId: 'c1', total: 18000, subtotal: 15254, taxRate: 18, taxAmount: 2746, status: 'draft', dueDate: '2025-01-05', createdAt: '2024-12-12' },
  { id: '7', invoiceNumber: 'INV-007', clientName: 'Priya Sharma', clientId: 'c2', total: 32500, subtotal: 27542, taxRate: 18, taxAmount: 4958, status: 'paid', dueDate: '2024-12-12', createdAt: '2024-11-28' },
  { id: '8', invoiceNumber: 'INV-008', clientName: 'Neha Gupta', clientId: 'c6', total: 9800, subtotal: 8305, taxRate: 18, taxAmount: 1495, status: 'pending', dueDate: '2024-12-30', createdAt: '2024-12-15' },
]

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

const emptyItem = (): InvoiceItem => ({
  id: Math.random().toString(36).substr(2, 9),
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
})

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  // Create invoice form
  const [formClientId, setFormClientId] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formTaxRate, setFormTaxRate] = useState('18')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<InvoiceItem[]>([emptyItem()])

  const fetchInvoices = useCallback(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setInvoices(data)
        } else {
          setInvoices(demoInvoices)
        }
        setLoading(false)
      })
      .catch(() => {
        setInvoices(demoInvoices)
        setLoading(false)
      })
  }, [])

  const fetchClients = useCallback(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setClients(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchInvoices()
    fetchClients()
  }, [fetchInvoices, fetchClients])

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalAmount = filtered.reduce((sum, inv) => sum + inv.total, 0)
  const overdueAmount = filtered
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        updated.amount = updated.quantity * updated.rate
        return updated
      })
    )
  }

  const addItem = () => setFormItems((prev) => [...prev, emptyItem()])
  const removeItem = (id: string) => {
    if (formItems.length > 1) setFormItems((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = formItems.reduce((sum, i) => sum + i.amount, 0)
  const taxRate = parseFloat(formTaxRate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleCreate = async () => {
    if (!formClientId || !formDueDate) {
      toast.error('Please select a client and due date')
      return
    }
    const validItems = formItems.filter((i) => i.description && i.rate > 0)
    if (validItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formClientId,
          dueDate: formDueDate,
          taxRate,
          notes: formNotes,
          items: validItems,
        }),
      })
      if (res.ok) {
        toast.success('Invoice created successfully!')
        setCreateOpen(false)
        resetForm()
        fetchInvoices()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create invoice')
      }
    } catch {
      toast.error('Failed to create invoice')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Invoice deleted')
        fetchInvoices()
      }
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success('Invoice status updated')
        fetchInvoices()
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setFormClientId('')
    setFormDueDate('')
    setFormTaxRate('18')
    setFormNotes('')
    setFormItems([emptyItem()])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your invoices.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{filtered.length}</div>
              <div className="text-xs text-muted-foreground">Total Invoices</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">₹{overdueAmount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Overdue Amount</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {invoices.length === 0
                  ? 'Create your first invoice to get started'
                  : 'Try adjusting your filters'}
              </p>
              {invoices.length === 0 && (
                <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Invoice #</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Due Date</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Created</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm font-medium">{inv.invoiceNumber}</td>
                      <td className="p-4 text-sm">{inv.clientName}</td>
                      <td className="p-4 text-sm font-medium">₹{inv.total.toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={statusColors[inv.status] || ''}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{inv.dueDate}</td>
                      <td className="p-4 text-sm text-muted-foreground">{inv.createdAt}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setViewOpen(true) }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {inv.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(inv.id, 'paid')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(inv.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" value={formTaxRate} onChange={(e) => setFormTaxRate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Line Items</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Rate (₹)</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>
                {formItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-5"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-2 text-right text-sm font-medium">
                      ₹{item.amount.toLocaleString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-medium">₹{Math.round(taxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                <span>Total</span>
                <span className="text-emerald-600">₹{Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-medium">{selectedInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={statusColors[selectedInvoice.status] || ''}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{selectedInvoice.createdAt}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selectedInvoice.subtotal?.toLocaleString() || selectedInvoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tax ({selectedInvoice.taxRate || 18}%)</span>
                  <span>₹{selectedInvoice.taxAmount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

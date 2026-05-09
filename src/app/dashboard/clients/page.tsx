'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Eye,
  Trash2,
  Users,
  FileSpreadsheet,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
  city?: string
  country?: string
  notes?: string
  _count?: { invoices: number }
  _total?: number
}

const demoClients: Client[] = [
  { id: 'c1', name: 'Rajesh Kumar', company: 'TechCorp', email: 'rajesh@techcorp.com', phone: '+91 98765 43210', city: 'Mumbai', country: 'India', _count: { invoices: 3 }, _total: 48000 },
  { id: 'c2', name: 'Priya Sharma', company: 'DesignHub', email: 'priya@designhub.com', phone: '+91 87654 32109', city: 'Delhi', country: 'India', _count: { invoices: 2 }, _total: 57500 },
  { id: 'c3', name: 'Amit Mehta', company: 'DevStudio', email: 'amit@devstudio.com', phone: '+91 76543 21098', city: 'Bangalore', country: 'India', _count: { invoices: 1 }, _total: 8200 },
  { id: 'c4', name: 'Sneha Patil', company: 'CreativeWorks', email: 'sneha@creativeworks.com', phone: '+91 65432 10987', city: 'Pune', country: 'India', _count: { invoices: 1 }, _total: 45000 },
  { id: 'c5', name: 'Vikram Singh', company: 'WebSolutions', email: 'vikram@websolutions.com', phone: '+91 54321 09876', city: 'Hyderabad', country: 'India', _count: { invoices: 1 }, _total: 12300 },
  { id: 'c6', name: 'Neha Gupta', company: 'MarketingPro', email: 'neha@marketingpro.com', phone: '+91 43210 98765', city: 'Chennai', country: 'India', _count: { invoices: 1 }, _total: 9800 },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  // Form
  const [formName, setFormName] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchClients = useCallback(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setClients(data)
        } else {
          setClients(demoClients)
        }
        setLoading(false)
      })
      .catch(() => {
        setClients(demoClients)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  )

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const handleCreate = async () => {
    if (!formName || !formEmail) {
      toast.error('Name and email are required')
      return
    }
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          company: formCompany,
          email: formEmail,
          phone: formPhone,
          city: formCity,
          country: formCountry,
          notes: formNotes,
        }),
      })
      if (res.ok) {
        toast.success('Client created successfully!')
        setCreateOpen(false)
        resetForm()
        fetchClients()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create client')
      }
    } catch {
      toast.error('Failed to create client')
    }
  }

  const handleDelete = async (id: string) => {
    toast.error('Demo data cannot be deleted')
  }

  const resetForm = () => {
    setFormName('')
    setFormCompany('')
    setFormEmail('')
    setFormPhone('')
    setFormCity('')
    setFormCountry('')
    setFormNotes('')
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client relationships.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No clients found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {clients.length === 0 ? 'Add your first client to get started' : 'Try adjusting your search'}
          </p>
          {clients.length === 0 && (
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-semibold">{client.name}</h3>
                        {client.company && (
                          <p className="text-xs text-muted-foreground">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedClient(client); setViewOpen(true) }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.city && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{client.city}{client.country ? `, ${client.country}` : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {client._count?.invoices || 0} invoices
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600">
                      ₹{((client._total || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={formCountry} onValueChange={setFormCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Any additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    {getInitials(selectedClient.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedClient.name}</h3>
                  {selectedClient.company && (
                    <p className="text-sm text-muted-foreground">{selectedClient.company}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {selectedClient.email}
                </div>
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedClient.phone}
                  </div>
                )}
                {selectedClient.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {selectedClient.city}{selectedClient.country ? `, ${selectedClient.country}` : ''}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Total Invoices</p>
                  <p className="text-lg font-bold">{selectedClient._count?.invoices || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-emerald-600">₹{((selectedClient._total || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

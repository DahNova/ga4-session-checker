'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { Property } from '@/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { useLocale } from '@/contexts/LocaleContext'
import { LanguageToggle } from '@/components/LanguageToggle'

const ITEMS_PER_PAGE = 25

type SortField = 'name' | 'propertyId' | 'accountId' | 'lastChecked' | 'sessions' | 'status'
type SortOrder = 'asc' | 'desc'

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [accountNames, setAccountNames] = useState<Record<string, string>>({})
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAccountId, setFilterAccountId] = useState<string>('all_accounts')
  const [accountSearchOpen, setAccountSearchOpen] = useState(false)
  const [accountSearchTerm, setAccountSearchTerm] = useState("")
  const { t } = useLocale()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProperties()
    }
  }, [user])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties', {
        headers: {
          'Cache-Control': 'no-cache'  // Force fresh data on initial load
        }
      })
      if (!response.ok) throw new Error('Failed to fetch properties')
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchAccountName = async (accountId: string) => {
    if (accountNames[accountId]) return; // Don't refetch if we already have it
    
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        headers: {
          'Cache-Control': 'no-cache'  // Force fresh data on initial load
        }
      })
      if (!response.ok) throw new Error('Failed to fetch account name')
      const data = await response.json()
      setAccountNames(prev => ({ ...prev, [accountId]: data.name }))
    } catch (error) {
      console.error('Error fetching account name:', error)
      // Set a temporary value to prevent constant retries
      setAccountNames(prev => ({ ...prev, [accountId]: `Account ${accountId}` }))
    }
  }

  useEffect(() => {
    const uniqueAccountIds = [...new Set(properties.map(p => p.accountId))]
    // Process account names sequentially to avoid overwhelming the server
    uniqueAccountIds.reduce(async (promise, accountId) => {
      await promise
      return fetchAccountName(accountId)
    }, Promise.resolve())
  }, [properties])

  const handleAddProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          propertyId: formData.get('propertyId'),
          accountId: formData.get('accountId'),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await fetchProperties()
      setShowModal(false)
      form.reset()
    } catch (error) {
      console.error('Error adding property:', error)
      alert(error instanceof Error ? error.message : 'Failed to add property')
    }
  }

  const handleManualCheck = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/check`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await fetchProperties()
    } catch (error) {
      console.error('Error performing manual check:', error)
      alert(error instanceof Error ? error.message : 'Failed to perform check')
    }
  }

  const handleImportProperties = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setImporting(true)

    try {
      const response = await fetch('/api/properties/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: formData.get('accountId'),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const result = await response.json()
      await fetchProperties()
      setShowImportModal(false)
      form.reset()
      alert(`Successfully imported ${result.imported.length} properties. ${result.skipped} properties were already imported. ${result.errors.length} errors occurred.`)
    } catch (error) {
      console.error('Error importing properties:', error)
      alert(error instanceof Error ? error.message : 'Failed to import properties')
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      await fetchProperties()
    } catch (error) {
      console.error('Error deleting property:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete property')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    )
  }

  const formatSessionCount = (property: Property) => {
    if (!property.checks || property.checks.length === 0) return 'No data'
    const latestCheck = property.checks[0]
    return latestCheck.sessions.toLocaleString()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal':
        return 'default'
      case 'anomaly':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getUniqueAccounts = () => {
    const accounts = [...new Set(properties.map(p => p.accountId))].sort()
    return [
      { id: 'all_accounts', name: 'All Accounts' },
      ...accounts.map(id => ({
        id,
        name: accountNames[id] || `Dexanet - ${id}`
      }))
    ]
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)))
    } else {
      setSelectedProperties(new Set())
    }
  }

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    const newSelected = new Set(selectedProperties)
    if (checked) {
      newSelected.add(propertyId)
    } else {
      newSelected.delete(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const handleBulkCheck = async () => {
    for (const propertyId of selectedProperties) {
      await handleManualCheck(propertyId)
    }
    setSelectedProperties(new Set())
  }

  const getSortedProperties = (properties: Property[]) => {
    return [...properties].sort((a, b) => {
      if (sortField === 'sessions') {
        const aValue = a.checks?.[0]?.sessions ?? 0
        const bValue = b.checks?.[0]?.sessions ?? 0
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (sortField === 'lastChecked') {
        const aValue = a.lastChecked ? new Date(a.lastChecked).getTime() : 0
        const bValue = b.lastChecked ? new Date(b.lastChecked).getTime() : 0
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aValue = (a[sortField as keyof Omit<Property, 'checks'>] ?? '').toString()
      const bValue = (b[sortField as keyof Omit<Property, 'checks'>] ?? '').toString()
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }

  const filteredProperties = properties
    .filter(property => {
      const matchesSearch = 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.propertyId.includes(searchTerm) ||
        property.accountId.includes(searchTerm)

      const matchesStatus = filterStatus === 'all' || property.status === filterStatus
      const matchesAccount = filterAccountId === 'all_accounts' || property.accountId === filterAccountId

      return matchesSearch && matchesStatus && matchesAccount
    })

  const sortedProperties = getSortedProperties(filteredProperties)
  const totalPages = Math.ceil(sortedProperties.length / ITEMS_PER_PAGE)
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">{t('dashboard.title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <span className="mr-2">↓</span>
                  {t('dashboard.importProperties')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('dashboard.import.title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleImportProperties} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dashboard.import.accountId')}</label>
                    <Input
                      type="text"
                      name="accountId"
                      placeholder="36890349"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('dashboard.import.accountIdDesc')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={importing}>
                      {importing ? t('dashboard.import.importing') : t('dashboard.importProperties')}
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowImportModal(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button>
                  <span className="mr-2">+</span>
                  {t('dashboard.addProperty')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('dashboard.add.title')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProperty} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dashboard.add.propertyId')}</label>
                    <Input
                      type="text" 
                      name="propertyId"
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dashboard.add.accountId')}</label>
                    <Input
                      type="text" 
                      name="accountId"
                      placeholder="98765432"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dashboard.add.name')}</label>
                    <Input
                      type="text" 
                      name="name"
                      placeholder="My Website"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">{t('dashboard.addProperty')}</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => router.push('/settings')}>
              <span className="mr-2">⚙️</span>
              {t('dashboard.settings')}
            </Button>
            <Button variant="outline" onClick={signOut}>{t('dashboard.logout')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input
                  placeholder={t('dashboard.filters.searchProperties')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-64"
                />
                <Select
                  value={filterStatus}
                  onValueChange={(value: string) => {
                    setFilterStatus(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('dashboard.filters.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.filters.all')}</SelectItem>
                    <SelectItem value="normal">{t('dashboard.status.normal')}</SelectItem>
                    <SelectItem value="anomaly">{t('dashboard.status.anomaly')}</SelectItem>
                    <SelectItem value="pending">{t('dashboard.status.pending')}</SelectItem>
                  </SelectContent>
                </Select>
                <Popover open={accountSearchOpen} onOpenChange={setAccountSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountSearchOpen}
                      className="w-[280px] justify-between"
                    >
                      {filterAccountId
                        ? getUniqueAccounts().find((account) => account.id === filterAccountId)?.name
                        : t('dashboard.filters.filterByAccount')}
                      <span className="ml-2 h-4 w-4 shrink-0 opacity-50">↓</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput
                        placeholder={t('common.search')}
                        value={accountSearchTerm}
                        onValueChange={setAccountSearchTerm}
                      />
                      <CommandEmpty>{t('common.noData')}</CommandEmpty>
                      <CommandGroup>
                        {getUniqueAccounts()
                          .filter(account => 
                            account.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                            account.id.toLowerCase().includes(accountSearchTerm.toLowerCase())
                          )
                          .map((account) => (
                            <CommandItem
                              key={account.id}
                              onSelect={() => {
                                setFilterAccountId(account.id)
                                setAccountSearchOpen(false)
                                setCurrentPage(1)
                              }}
                              className="cursor-pointer"
                            >
                              <span>{account.name}</span>
                              {account.id !== 'all_accounts' && (
                                <span className="ml-2 text-muted-foreground">({account.id})</span>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                {selectedProperties.size > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleBulkCheck}
                  >
                    {t('dashboard.checkNow')} ({selectedProperties.size})
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.pagination.showing', { shown: paginatedProperties.length, total: sortedProperties.length })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {t('dashboard.pagination.previous')}
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {t('dashboard.pagination.page', { current: currentPage, total: totalPages })}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {t('dashboard.pagination.next')}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedProperties.size === filteredProperties.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                  {t('dashboard.sortFields.name')} {getSortIcon('name')}
                </TableHead>
                <TableHead onClick={() => handleSort('propertyId')} className="cursor-pointer">
                  {t('dashboard.sortFields.propertyId')} {getSortIcon('propertyId')}
                </TableHead>
                <TableHead onClick={() => handleSort('accountId')} className="cursor-pointer">
                  {t('dashboard.sortFields.accountId')} {getSortIcon('accountId')}
                </TableHead>
                <TableHead onClick={() => handleSort('lastChecked')} className="cursor-pointer">
                  {t('dashboard.sortFields.lastChecked')} {getSortIcon('lastChecked')}
                </TableHead>
                <TableHead onClick={() => handleSort('sessions')} className="cursor-pointer text-right">
                  {t('dashboard.sortFields.sessions')} {getSortIcon('sessions')}
                </TableHead>
                <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                  {t('dashboard.sortFields.status')} {getSortIcon('status')}
                </TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <p className="font-medium">
                      {properties.length === 0 ? t('dashboard.noProperties.title') : t('dashboard.noResults.title')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {properties.length === 0 
                        ? t('dashboard.noProperties.description')
                        : t('dashboard.noResults.description')
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProperties.has(property.id)}
                        onCheckedChange={(checked) => handleSelectProperty(property.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.propertyId}</TableCell>
                    <TableCell>{accountNames[property.accountId] || property.accountId}</TableCell>
                    <TableCell>
                      {property.lastChecked 
                        ? new Date(property.lastChecked).toLocaleString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatSessionCount(property)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(property.status)}>
                        {t(`dashboard.status.${property.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleManualCheck(property.id)}
                          className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {t('dashboard.checkNow')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDeleteProperty(property.id)}
                          className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
} 
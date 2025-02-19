export type Property = {
  id: string
  name: string
  propertyId: string
  accountId: string
  userId: string
  lastChecked: string | null
  status: 'pending' | 'normal' | 'anomaly'
  createdAt: string
  updatedAt: string
  checks?: Check[]
}

export type Check = {
  id: string
  propertyId: string
  sessions: number
  timestamp: string
  status: string
  error: string | null
} 
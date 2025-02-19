'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useLocale } from '@/contexts/LocaleContext'
import { LanguageToggle } from '@/components/LanguageToggle'

interface Settings {
  anomalyThreshold: number
  minSessions: number
  warningSeverity: number
  criticalSeverity: number
  compareWithDays: number
  checkFrequency: 'hourly' | 'daily' | 'custom'
  checkTime?: string
  customCron?: string
  timeZone: string
  emailNotifications: boolean
  emailAddresses: string[]
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFromEmail?: string
  smtpFromName?: string
  slackWebhook?: string
  telegramChatId?: string
  defaultPageSize: number
  defaultSortField: string
  defaultSortOrder: 'asc' | 'desc'
  checkDelaySeconds: number
}

const defaultSettings: Settings = {
  // Anomaly Detection
  anomalyThreshold: 0.5,
  minSessions: 100,
  warningSeverity: 0.3,
  criticalSeverity: 0.5,
  compareWithDays: 7,

  // Schedule
  checkFrequency: 'daily',
  customCron: '',
  checkTime: '00:00',
  timeZone: 'UTC',
  checkDelaySeconds: 2,

  // Notifications
  emailNotifications: true,
  emailAddresses: [],
  slackWebhook: '',
  telegramChatId: '',

  // SMTP Settings
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpFromEmail: '',
  smtpFromName: '',

  // Dashboard Preferences
  defaultPageSize: 25,
  defaultSortField: 'name',
  defaultSortOrder: 'asc',
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const { t } = useLocale()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchSettings()
    }
  }, [user, loading, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Don't show alert for auth errors as we're redirecting
      if (!loading && error instanceof Error && !error.message.includes('Unauthorized')) {
        alert(error.message)
      }
    }
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data)
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">{t('settings.title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              {t('common.back')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="anomaly">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSaveSettings} className="space-y-6 mt-6">
              <TabsContent value="anomaly">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Anomaly Threshold (%)</Label>
                      <Input
                        type="number"
                        value={settings.anomalyThreshold.toString()}
                        onChange={(e) => setSettings({ ...settings, anomalyThreshold: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Percentage drop in sessions to consider as anomaly
                      </p>
                    </div>
                    <div>
                      <Label>Minimum Sessions</Label>
                      <Input
                        type="number"
                        value={settings.minSessions.toString()}
                        onChange={(e) => setSettings({ ...settings, minSessions: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum sessions required to check for anomalies
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warning Severity (%)</Label>
                      <Input
                        type="number"
                        value={settings.warningSeverity.toString()}
                        onChange={(e) => setSettings({ ...settings, warningSeverity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label>Critical Severity (%)</Label>
                      <Input
                        type="number"
                        value={settings.criticalSeverity.toString()}
                        onChange={(e) => setSettings({ ...settings, criticalSeverity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Compare With Last (Days)</Label>
                    <Input
                      type="number"
                      value={settings.compareWithDays.toString()}
                      onChange={(e) => setSettings({ ...settings, compareWithDays: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="30"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Number of days to compare with for anomaly detection
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule">
                <div className="space-y-4">
                  <div>
                    <Label>Check Frequency</Label>
                    <Select
                      value={settings.checkFrequency}
                      onValueChange={(value) => setSettings({ ...settings, checkFrequency: value as 'hourly' | 'daily' | 'custom' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {settings.checkFrequency === 'daily' && (
                    <div>
                      <Label>Check Time</Label>
                      <Input
                        type="time"
                        value={settings.checkTime}
                        onChange={(e) => setSettings({ ...settings, checkTime: e.target.value })}
                      />
                    </div>
                  )}
                  {settings.checkFrequency === 'custom' && (
                    <div>
                      <Label>Custom Cron Expression</Label>
                      <Input
                        value={settings.customCron}
                        onChange={(e) => setSettings({ ...settings, customCron: e.target.value })}
                        placeholder="*/30 * * * *"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Use cron expression format (e.g., */30 * * * * for every 30 minutes)
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>Time Zone</Label>
                    <Select
                      value={settings.timeZone}
                      onValueChange={(value) => setSettings({ ...settings, timeZone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                        {/* Add more timezones as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Delay Between Checks (seconds)</Label>
                    <Input
                      type="number"
                      value={settings.checkDelaySeconds || 2}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        checkDelaySeconds: parseInt(e.target.value) || 2 
                      })}
                      min="1"
                      max="60"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Delay between checking each property to avoid GA4 API rate limits
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for anomalies
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, emailNotifications: checked })}
                      />
                    </div>
                    {settings.emailNotifications && (
                      <>
                        <div>
                          <Label>Notification Emails</Label>
                          <Input
                            type="text"
                            value={settings.emailAddresses.join(', ') || ''}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              emailAddresses: e.target.value.split(',').map((email) => email.trim()) 
                            })}
                            placeholder="email@example.com, another@example.com"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Separate multiple email addresses with commas
                          </p>
                        </div>
                        <div className="space-y-4">
                          <Label>SMTP Settings</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="SMTP Host"
                              value={settings.smtpHost || ''}
                              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            />
                            <Input
                              type="number"
                              placeholder="SMTP Port"
                              value={settings.smtpPort || ''}
                              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="SMTP Username"
                              value={settings.smtpUser || ''}
                              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                            />
                            <Input
                              type="password"
                              placeholder="SMTP Password"
                              value={settings.smtpPassword || ''}
                              onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="From Email"
                              value={settings.smtpFromEmail || ''}
                              onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                            />
                            <Input
                              placeholder="From Name"
                              value={settings.smtpFromName || ''}
                              onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/settings/test-email', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(settings),
                                  });

                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || 'Failed to send test email');
                                  }

                                  alert('Test email sent successfully!');
                                } catch (error) {
                                  alert(error instanceof Error ? error.message : 'Failed to send test email');
                                }
                              }}
                            >
                              {t('settings.notifications.email.smtp.testButton')}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Slack Webhook URL (Optional)</Label>
                      <Input
                        value={settings.slackWebhook || ''}
                        onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Telegram Chat ID</Label>
                        <div className="flex gap-2">
                          <Input
                            value={settings.telegramChatId || ''}
                            onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                            placeholder="@channelname or chat ID"
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/settings/test-telegram', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify(settings),
                                });

                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Failed to send test message');
                                }

                                alert('Test message sent successfully!');
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Failed to send test message');
                              }
                            }}
                          >
                            Test Telegram
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/settings/send-telegram-anomalies', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify(settings),
                                });

                                if (!response.ok) {
                                  const error = await response.json();
                                  if (error.error === 'No anomalies found') {
                                    alert('Nessuna anomalia rilevata al momento');
                                    return;
                                  }
                                  throw new Error(error.error || 'Failed to send anomalies');
                                }

                                alert('Anomalie inviate con successo!');
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Failed to send anomalies');
                              }
                            }}
                          >
                            Invia Anomalie
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          1. Start a chat with <a href="https://t.me/ga4_claudio_anomalies_bot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@ga4_claudio_anomalies_bot</a><br />
                          2. Add the bot to your group/channel as admin<br />
                          3. Send a message in the chat<br />
                          4. Use the channel username (with @) or get the chat ID from the bot
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences">
                <div className="space-y-4">
                  <div>
                    <Label>Default Page Size</Label>
                    <Select
                      value={settings.defaultPageSize.toString()}
                      onValueChange={(value) => setSettings({ ...settings, defaultPageSize: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Sort Field</Label>
                    <Select
                      value={settings.defaultSortField}
                      onValueChange={(value) => setSettings({ ...settings, defaultSortField: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="propertyId">Property ID</SelectItem>
                        <SelectItem value="accountId">Account ID</SelectItem>
                        <SelectItem value="lastChecked">Last Checked</SelectItem>
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Sort Order</Label>
                    <Select
                      value={settings.defaultSortOrder}
                      onValueChange={(value) => setSettings({ ...settings, defaultSortOrder: value as 'asc' | 'desc' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
} 
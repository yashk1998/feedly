'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, CreditCard, Bell, Shield, Moon, Sun, Monitor, Key, Trash2, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api-client'

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')

  const { data: creditUsage } = useQuery({
    queryKey: ['creditUsage'],
    queryFn: () => api.get('/ai/credits') as Promise<{ used: number; limit: number; plan: string }>,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => api.put('/user/settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      toast.success('Settings updated')
    },
    onError: () => toast.error('Failed to update settings'),
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Moon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-parchment-100 dark:bg-night-900">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-800 dark:text-ink-50 mb-2">Settings</h1>
          <p className="text-ink-500 dark:text-ink-400">Manage your account preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400'
                    : 'text-ink-600 dark:text-ink-400 hover:bg-parchment-200 dark:hover:bg-ink-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <ProfileSettings
                user={session?.user}
                onSave={(s: Record<string, unknown>) => updateSettingsMutation.mutate(s)}
              />
            )}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'notifications' && (
              <NotificationSettings onSave={(s: Record<string, unknown>) => updateSettingsMutation.mutate(s)} />
            )}
            {activeTab === 'api-keys' && <ApiKeySettings />}
            {activeTab === 'billing' && <BillingSettings creditUsage={creditUsage} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ user, onSave }: { user: any; onSave: (s: Record<string, unknown>) => void }) {
  const [timezone, setTimezone] = useState('UTC')
  const [refreshInterval, setRefreshInterval] = useState('60')

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Profile</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Email Address</label>
          <input type="email" value={user?.email || ''} disabled className="input bg-parchment-200 dark:bg-ink-800" />
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Managed through your authentication provider
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Timezone</label>
          <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Kolkata">India</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">
            Default Refresh Interval
          </label>
          <select className="input" value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)}>
            <option value="60">1 hour</option>
            <option value="180">3 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>

        <button
          onClick={() => onSave({ timezone, refreshInterval: parseInt(refreshInterval) })}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

function AppearanceSettings() {
  const [theme, setTheme] = useState('system')

  const applyTheme = (value: string) => {
    setTheme(value)
    if (value === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (value === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Appearance</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  theme === t.id
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/20'
                    : 'border-parchment-300 dark:border-ink-700 hover:border-sage-300 dark:hover:border-sage-800'
                }`}
              >
                <t.icon className={`h-6 w-6 mx-auto mb-2 ${theme === t.id ? 'text-sage-600' : 'text-ink-400'}`} />
                <span className={`text-sm font-medium ${theme === t.id ? 'text-sage-700 dark:text-sage-400' : 'text-ink-600 dark:text-ink-400'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings({ onSave }: { onSave: (s: Record<string, unknown>) => void }) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [digestFrequency, setDigestFrequency] = useState('daily')
  const [newArticleAlerts, setNewArticleAlerts] = useState(false)

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Notifications</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink-800 dark:text-ink-100">Email Notifications</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">Receive email updates about your feeds</p>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotifications ? 'bg-sage-600' : 'bg-parchment-300 dark:bg-ink-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              emailNotifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Digest Frequency</label>
          <select className="input" value={digestFrequency} onChange={(e) => setDigestFrequency(e.target.value)}>
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink-800 dark:text-ink-100">New Article Alerts</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">Get notified when new articles are available</p>
          </div>
          <button
            onClick={() => setNewArticleAlerts(!newArticleAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              newArticleAlerts ? 'bg-sage-600' : 'bg-parchment-300 dark:bg-ink-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              newArticleAlerts ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <button
          onClick={() => onSave({ emailNotifications, digestFrequency, newArticleAlerts })}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

function BillingSettings({ creditUsage }: { creditUsage: any }) {
  const used = creditUsage?.used || 0
  const limit = creditUsage?.limit || 5
  const plan = creditUsage?.plan || 'free'
  const percentage = Math.min((used / limit) * 100, 100)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-ink-800 dark:text-ink-100 capitalize">{plan} Plan</h3>
            <p className="text-ink-500 dark:text-ink-400">{limit} AI credits per month</p>
          </div>
          {plan === 'free' && (
            <button className="btn btn-primary">Upgrade Plan</button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">AI Credit Usage</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-ink-600 dark:text-ink-400">Credits Used This Month</span>
            <span className="font-medium text-ink-800 dark:text-ink-100">{used} / {limit}</span>
          </div>
          <div className="w-full bg-parchment-300 dark:bg-ink-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${percentage > 80 ? 'bg-coral-500' : 'bg-sage-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Credits reset on your billing cycle anniversary
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-xl text-ink-800 dark:text-ink-50 mb-6">Payment History</h2>
        <div className="text-center py-8">
          <p className="text-ink-500 dark:text-ink-400">No payment history available</p>
          <p className="text-sm text-ink-400 dark:text-ink-500 mt-2">You&apos;re currently on the free plan</p>
        </div>
      </div>
    </div>
  )
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', defaultModel: 'claude-3-haiku-20240307' },
  { id: 'google', name: 'Google Gemini', placeholder: 'AI...', defaultModel: 'gemini-2.0-flash-lite' },
  { id: 'groq', name: 'Groq', placeholder: 'gsk_...', defaultModel: 'llama-3.1-8b-instant' },
]

function ApiKeySettings() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')

  const { data: keysData, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys') as Promise<{ keys: any[] }>,
  })

  const addKeyMutation = useMutation({
    mutationFn: (data: { provider: string; apiKey: string; model?: string }) =>
      api.post('/api-keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setShowAddForm(false)
      setApiKey('')
      setModel('')
      toast.success('API key saved')
    },
    onError: () => toast.error('Failed to save API key'),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key removed')
    },
    onError: () => toast.error('Failed to remove API key'),
  })

  const toggleKeyMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.put(`/api-keys/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const handleAdd = () => {
    if (!apiKey.trim()) return
    addKeyMutation.mutate({
      provider: selectedProvider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
    })
  }

  const keys = keysData?.keys || []
  const providerInfo = PROVIDERS.find((p) => p.id === selectedProvider)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-ink-800 dark:text-ink-50">API Keys (BYOK)</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              Use your own API keys for AI features. Your keys are used instead of system credits.
            </p>
          </div>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4 mr-1" />Add Key
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="p-4 rounded-xl border border-parchment-300 dark:border-ink-600 bg-parchment-50 dark:bg-ink-800/50 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">Provider</label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProvider(p.id); setModel('') }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedProvider === p.id
                        ? 'bg-sage-600 text-white'
                        : 'bg-parchment-200 dark:bg-ink-700 text-ink-600 dark:text-ink-400 hover:bg-parchment-300 dark:hover:bg-ink-600'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">API Key</label>
              <input
                type="password"
                className="input"
                placeholder={providerInfo?.placeholder || 'Enter your API key'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                Model Override <span className="text-ink-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder={providerInfo?.defaultModel || 'Default model'}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                Leave empty to use: {providerInfo?.defaultModel}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={addKeyMutation.isPending || !apiKey.trim()} className="btn btn-primary btn-sm">
                <Check className="h-4 w-4 mr-1" />Save Key
              </button>
              <button onClick={() => { setShowAddForm(false); setApiKey(''); setModel('') }} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700">
                <div className="skeleton h-5 w-24" />
                <div className="flex-1"><div className="skeleton h-4 w-32" /></div>
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-8 w-8 mx-auto mb-3 text-ink-300 dark:text-ink-600" />
            <p className="text-ink-500 dark:text-ink-400">No API keys configured</p>
            <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
              Add your own keys to use AI features without consuming system credits
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key: any) => {
              const provider = PROVIDERS.find((p) => p.id === key.provider)
              return (
                <div key={key.id} className="flex items-center gap-4 p-4 rounded-xl border border-parchment-300 dark:border-ink-700">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-ink-800 dark:text-ink-100">{provider?.name || key.provider}</span>
                      {key.model && (
                        <span className="text-xs px-2 py-0.5 rounded bg-parchment-200 dark:bg-ink-700 text-ink-500">
                          {key.model}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-ink-400 dark:text-ink-500 font-mono">{key.maskedKey}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleKeyMutation.mutate({ id: key.id, isActive: !key.isActive })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        key.isActive ? 'bg-sage-600' : 'bg-parchment-300 dark:bg-ink-600'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        key.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Remove this API key?')) deleteKeyMutation.mutate(key.id) }}
                      className="btn btn-ghost btn-sm text-error-500 hover:text-error-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-medium text-ink-800 dark:text-ink-100 mb-3">How BYOK Works</h3>
        <ul className="space-y-2 text-sm text-ink-500 dark:text-ink-400">
          <li>Your API keys are used for all AI features (summaries, social posts, translations, digests)</li>
          <li>When your key is active, no system AI credits are consumed</li>
          <li>Keys are stored securely and never shared</li>
          <li>You can set a custom model for each provider</li>
        </ul>
      </div>
    </div>
  )
}

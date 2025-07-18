import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useUser } from '@clerk/clerk-react'
import { Save, CreditCard, Users, Bell, Shield } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')

  const { data: creditUsage } = useQuery('credit-usage', async () => {
    const response = await axios.get('/api/user/credits')
    return response.data
  })

  const updateSettingsMutation = useMutation(
    async (settings: any) => {
      const response = await axios.put('/api/user/settings', settings)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-settings')
        toast.success('Settings updated successfully!')
      },
      onError: () => {
        toast.error('Failed to update settings')
      }
    }
  )

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'team', name: 'Team', icon: Users },
  ]

  const handleSaveSettings = (settings: any) => {
    updateSettingsMutation.mutate(settings)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings user={user} onSave={handleSaveSettings} />}
          {activeTab === 'notifications' && <NotificationSettings onSave={handleSaveSettings} />}
          {activeTab === 'billing' && <BillingSettings creditUsage={creditUsage} />}
          {activeTab === 'team' && <TeamSettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ user, onSave }: any) {
  const [timezone, setTimezone] = useState('UTC')
  const [refreshInterval, setRefreshInterval] = useState('60')

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={user?.primaryEmailAddress?.emailAddress || ''}
            disabled
            className="input bg-gray-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            Email address is managed through your authentication provider
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Refresh Interval (minutes)
          </label>
          <select
            className="input"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
          >
            <option value="60">1 hour</option>
            <option value="180">3 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>

        <button
          onClick={() => onSave({ timezone, refreshInterval: parseInt(refreshInterval) })}
          className="btn btn-primary flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

function NotificationSettings({ onSave }: any) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [digestFrequency, setDigestFrequency] = useState('daily')
  const [newArticleAlerts, setNewArticleAlerts] = useState(false)

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive email updates about your feeds</p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digest Frequency
          </label>
          <select
            className="input"
            value={digestFrequency}
            onChange={(e) => setDigestFrequency(e.target.value)}
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">New Article Alerts</h3>
            <p className="text-sm text-gray-500">Get notified when new articles are available</p>
          </div>
          <input
            type="checkbox"
            checked={newArticleAlerts}
            onChange={(e) => setNewArticleAlerts(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </div>

        <button
          onClick={() => onSave({ emailNotifications, digestFrequency, newArticleAlerts })}
          className="btn btn-primary flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

function BillingSettings({ creditUsage }: any) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Plan</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Free Plan</h3>
            <p className="text-gray-600">5 AI credits per month</p>
          </div>
          <button className="btn btn-primary">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Credit Usage */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Credit Usage</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Credits Used This Month</span>
            <span className="font-medium">{creditUsage?.used || 0} / {creditUsage?.limit || 5}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: `${((creditUsage?.used || 0) / (creditUsage?.limit || 5)) * 100}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-600">
            Credits reset on your billing cycle anniversary
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment History</h2>
        
        <div className="text-center py-8">
          <p className="text-gray-600">No payment history available</p>
          <p className="text-sm text-gray-500 mt-2">You're currently on the free plan</p>
        </div>
      </div>
    </div>
  )
}

function TeamSettings() {
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
      
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Features</h3>
        <p className="text-gray-600 mb-6">
          Team collaboration features are available with Pro and Power plans
        </p>
        <button className="btn btn-primary">
          Upgrade to Access Team Features
        </button>
      </div>
    </div>
  )
} 
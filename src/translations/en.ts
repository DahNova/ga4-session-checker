export const en = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Settings saved successfully',
    error: 'Error',
    back: 'Back',
    delete: 'Delete',
    confirm: 'Confirm',
    cancel: 'Cancel',
    search: 'Search...',
    noData: 'No data available',
    actions: 'Actions',
  },
  dashboard: {
    title: 'GA4 Properties Monitor',
    subtitle: 'Monitor your GA4 properties and track session anomalies',
    addProperty: 'Add Property',
    importProperties: 'Import Properties',
    settings: 'Settings',
    logout: 'Log Out',
    sortFields: {
      name: 'Name',
      propertyId: 'Property ID',
      accountId: 'Account ID',
      lastChecked: 'Last Checked',
      sessions: 'Sessions',
      status: 'Status'
    },
    status: {
      normal: 'Normal',
      anomaly: 'Anomaly',
      pending: 'Pending'
    },
    checkNow: 'Check Now',
    deleteConfirm: 'Are you sure you want to delete this property? This action cannot be undone.',
    filters: {
      all: 'All Statuses',
      allAccounts: 'All Accounts',
      searchProperties: 'Search properties...',
      filterByStatus: 'Filter by status',
      filterByAccount: 'Filter by account'
    },
    import: {
      title: 'Import GA4 Properties',
      accountId: 'Account ID',
      accountIdDesc: 'Enter your GA4 account ID to import all accessible properties',
      importing: 'Importing...',
      success: 'Import completed successfully: {imported} properties imported, {skipped} already present, {errors} errors.'
    },
    add: {
      title: 'Add GA4 Property',
      propertyId: 'Property ID',
      accountId: 'Account ID',
      name: 'Property Name'
    },
    noProperties: {
      title: 'No properties added yet',
      description: 'Add your first GA4 property to start monitoring sessions'
    },
    noResults: {
      title: 'No matching properties found',
      description: 'Try adjusting your filters or search terms'
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page {current} of {total}',
      showing: 'Showing {shown} of {total} properties'
    }
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure your GA4 Properties Monitor',
    tabs: {
      anomaly: 'Anomaly Detection',
      schedule: 'Schedule',
      notifications: 'Notifications',
      preferences: 'Preferences'
    },
    anomaly: {
      threshold: 'Anomaly Threshold (%)',
      thresholdDesc: 'Percentage drop in sessions to consider as anomaly',
      minSessions: 'Minimum Sessions',
      minSessionsDesc: 'Minimum sessions required to check for anomalies',
      warningSeverity: 'Warning Severity (%)',
      criticalSeverity: 'Critical Severity (%)',
      compareDays: 'Compare With Last (Days)',
      compareDaysDesc: 'Number of days to compare with for anomaly detection'
    },
    schedule: {
      frequency: 'Check Frequency',
      frequencies: {
        hourly: 'Hourly',
        daily: 'Daily',
        custom: 'Custom'
      },
      checkTime: 'Check Time',
      cronExpression: 'Cron Expression',
      cronDesc: 'Use cron expression format (e.g., */30 * * * * for every 30 minutes)',
      timeZone: 'Time Zone'
    },
    notifications: {
      email: {
        title: 'Email Notifications',
        description: 'Receive email notifications for anomalies',
        addresses: 'Notification Emails',
        addressesDesc: 'Separate multiple email addresses with commas',
        smtp: {
          title: 'SMTP Settings',
          host: 'SMTP Host',
          port: 'SMTP Port',
          username: 'SMTP Username',
          password: 'SMTP Password',
          fromEmail: 'From Email',
          fromName: 'From Name',
          testButton: 'Send Test Email'
        }
      },
      slack: {
        title: 'Slack Webhook URL (Optional)',
        placeholder: 'https://hooks.slack.com/services/...'
      },
      telegram: {
        title: 'Telegram Chat ID (Optional)',
        placeholder: '@channelname or chat ID'
      }
    },
    preferences: {
      pageSize: 'Default Page Size',
      sortField: 'Default Sort Field',
      sortOrder: 'Default Sort Order',
      sortFields: {
        name: 'Name',
        propertyId: 'Property ID',
        accountId: 'Account ID',
        lastChecked: 'Last Checked',
        sessions: 'Sessions',
        status: 'Status'
      },
      sortOrders: {
        asc: 'Ascending',
        desc: 'Descending'
      }
    }
  }
} 
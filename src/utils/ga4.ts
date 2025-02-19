import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.manage.users.readonly'
];

const auth = new JWT({
  email: process.env.GA4_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const analyticsData = google.analyticsdata({
  version: 'v1beta',
  auth,
});

const analyticsAdmin = google.analyticsadmin({
  version: 'v1beta',
  auth,
});

export async function listAccountProperties(accountId: string) {
  try {
    const allProperties = [];
    let nextPageToken = undefined;

    do {
      const response = await analyticsAdmin.properties.list({
        filter: `parent:accounts/${accountId}`,
        pageSize: 200, // Maximum allowed page size
        pageToken: nextPageToken,
      });

      if (response.data.properties) {
        allProperties.push(...response.data.properties);
      }

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allProperties.map(property => ({
      propertyId: property.name?.split('/').pop() || '',
      displayName: property.displayName || '',
      createTime: property.createTime || '',
      updateTime: property.updateTime || '',
      accountId,
    }));
  } catch (error) {
    console.error('Error listing GA4 properties:', error);
    throw error;
  }
}

export async function getPropertySessions(propertyId: string, startDate: string, endDate: string) {
  try {
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
      },
    });

    const sessions = response.data.rows?.[0]?.metricValues?.[0]?.value || '0';
    return parseInt(sessions, 10);
  } catch (error) {
    console.error('Error fetching GA4 sessions:', error);
    throw error;
  }
}

export async function validatePropertyAccess(propertyId: string, accountId: string) {
  try {
    // Try to fetch a simple report to validate access
    await getPropertySessions(propertyId, 'yesterday', 'yesterday');
    return true;
  } catch (error) {
    console.error('Error validating GA4 property access:', error);
    return false;
  }
}

export async function checkForAnomalies(propertyId: string) {
  try {
    // Get sessions for yesterday
    const sessions = await getPropertySessions(
      propertyId,
      'yesterday',
      'yesterday'
    );

    // Simple anomaly detection: alert if sessions are zero
    const hasAnomaly = sessions === 0;

    return {
      hasAnomaly,
      sessions,
      message: hasAnomaly ? 'No sessions detected yesterday' : 'Traffic looks normal',
    };
  } catch (error) {
    console.error('Error checking for anomalies:', error);
    throw error;
  }
}

export async function getAccountName(accountId: string) {
  try {
    const response = await analyticsAdmin.accounts.get({
      name: `accounts/${accountId}`
    });

    return response.data.displayName || accountId;
  } catch (error) {
    console.error('Error fetching account name:', error);
    return accountId; // Return the ID if we can't get the name
  }
} 
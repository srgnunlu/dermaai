// Test script to verify settings save functionality
async function testSettingsSave() {
  const apiUrl = 'http://localhost:5000';

  // First, get the current settings
  try {
    console.log('Testing settings save functionality...');

    // Test data for settings update
    const settingsData = {
      useGemini: true,
      useOpenAI: false,
      confidenceThreshold: 50,
      autoSaveCases: true,
      anonymizeData: false,
      dataRetention: '180',
      theme: 'dark',
      compactMode: false,
      analysisNotifications: true,
      urgentAlerts: true,
      soundNotifications: false,
    };

    // Note: This won't work without authentication, but will help identify the error
    const response = await fetch(`${apiUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
      credentials: 'include',
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSettingsSave();

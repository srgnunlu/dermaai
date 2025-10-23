// Browser console script to test settings save
// Copy and paste this into the browser console on the /settings page

async function testSettingsSave() {
  console.log('Testing settings save...');

  const settingsData = {
    useGemini: true,
    useOpenAI: false,
    confidenceThreshold: 55,
    autoSaveCases: true,
    anonymizeData: false,
    dataRetention: '60',
    theme: 'light',
    compactMode: false,
    analysisNotifications: true,
    urgentAlerts: true,
    soundNotifications: false,
  };

  try {
    const response = await fetch('/api/settings', {
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

    if (!response.ok) {
      console.error('Settings save failed:', data);
    } else {
      console.log('Settings saved successfully!', data);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run this in the browser console
console.log('To test settings save, run: testSettingsSave()');
window.testSettingsSave = testSettingsSave;

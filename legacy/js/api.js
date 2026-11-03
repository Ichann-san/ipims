// api.js - Centralized API calls for IPIMS Web
//test
const API_BASE_URL = 'https://swivel-egging-slightly.ngrok-free.dev/api';

async function submitReportData(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/laporan`, {
      method: 'POST',
      body: data
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

async function runSimulationData(interventions) {
  try {
    const response = await fetch(`${API_BASE_URL}/simulasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ interventions })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
}

async function analyzePhotoData(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-photo`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing photo:', error);
    throw error;
  }
}

// Make globally available
window.ipimsAPI = {
  submitReportData,
  runSimulationData,
  analyzePhotoData
};

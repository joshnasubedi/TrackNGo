const API_BASE_URL = 'http://localhost:1337/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API fetch function
export const fetchDataFromApi = async (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔍 API Debug:');
  console.log('URL:', url);
  console.log('Token exists:', !!localStorage.getItem('token'));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('🔍 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 Error response:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

// Generic API post function
export const postDataToApi = async (endpoint, data) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log('📤 API POST Debug:');
  console.log('URL:', url);
  console.log('Data:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    console.log('🔍 POST Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 FULL POST Error response:', errorData);
      console.log('🔍 Error details:', errorData.error?.details);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('API post error:', error);
    throw error;
  }
};
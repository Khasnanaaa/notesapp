const API_URL = 'https://story-api.dicoding.dev/v1';
 


const StoryApi = {
  async login({ email, password }) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
        throw new Error(responseJson.message || 'Login failed. Check email and password.');
    }
    
    const loginResult = responseJson.loginResult;
    
    if (loginResult && loginResult.token) {
        localStorage.setItem('userToken', loginResult.token);
        return loginResult;
    }
    
    throw new Error('API response invalid or token not found.');
  },
  
  async getAllStories() {
    const token = localStorage.getItem('userToken');
    if (!token) {
      return []; 
    }

    const response = await fetch(`${API_URL}/stories?location=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        localStorage.removeItem('userToken');
        throw new Error('Token invalid or expired. Please login again.');
    }

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson.listStory.filter(story => story.lat && story.lon);
  },
  
  async addNewStory({ description, lat, lon, photo }) {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('User not logged in');
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('lat', lat);
    formData.append('lon', lon);
    formData.append('photo', photo); 

    const response = await fetch(`${API_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();
    if (!response.ok) {
        throw new Error(responseJson.message || 'Failed to upload story. Check file size or token.');
    }
    
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson.message;
  },



  async saveSubscription({ endpoint, keys }) {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('User not logged in');
    }

    const dataToSend = {
        endpoint,
        keys,
    };

    const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
    });
    
    const responseJson = await response.json();
    if (!response.ok || responseJson.error) {
        throw new Error(responseJson.message || 'Failed to save notification subscription.');
    }
    return responseJson.message;
  },
  
  async deleteSubscription(endpoint) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        throw new Error('User not logged in');
    }

    const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
    });

    const responseJson = await response.json();
    if (!response.ok || responseJson.error) {
        console.warn('Failed to delete subscription on server:', responseJson.message);
        return responseJson.message;
    }
    return responseJson.message;
  },
};

export default StoryApi;
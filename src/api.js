import axios from "axios";

const API_BASE_URL = "https://jx62z3hhfh.execute-api.ap-south-1.amazonaws.com/dev";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const signupUser = (data) => API.post("/auth/signup", data);
export const loginUser = (data) => API.post("/auth/login", data);

export const reportLostItem = (data) => {
  const formData = new FormData();
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('location', JSON.stringify(data.location));
  formData.append('userEmail', data.userEmail);
  formData.append('contactInfo', data.contactInfo);
  if (data.image) {
    formData.append('image', data.image);
  }
  return API.post("/items/lost", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const reportFoundItem = (data) => {
  const formData = new FormData();
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('location', JSON.stringify(data.location));
  formData.append('userEmail', data.userEmail);
  formData.append('contactInfo', data.contactInfo);
  formData.append('foundOption', data.foundOption);
  formData.append('vendorInfo', data.vendorInfo || '');
  if (data.image) {
    formData.append('image', data.image);
  }
  return API.post("/items/found", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Match endpoints
export const getMatches = (userEmail) => API.get(`/matches/${userEmail}`);
export const verifyMatch = (matchId, isVerified) => API.post(`/matches/${matchId}/verify`, { isVerified });

// User items endpoints
export const getUserLostItems = (userEmail) => API.get(`/items/lost/${userEmail}`);
export const getUserFoundItems = (userEmail) => API.get(`/items/found/${userEmail}`);

// Search endpoints
export const searchItems = (query) => API.get(`/search?q=${encodeURIComponent(query)}`);

// Image upload helper
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return API.post("/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

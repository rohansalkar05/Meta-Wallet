const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const signupApi = async (name, email, password) => {
  const response = await fetch(`${API_URL}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Signup failed.');
  }
  return data;
};

export const verifyOtpApi = async (email, otp, otpToken) => {
  const response = await fetch(`${API_URL}/api/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, otpToken })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed.');
  }
  return data;
};

export const loginApi = async (email, password) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed.');
  }
  return data;
};

export const getProfileApi = async (token) => {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile.');
  }
  return data;
};

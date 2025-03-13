const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const inputForm = document.getElementById('inputForm');
const authDiv = document.getElementById('auth');
const appDiv = document.getElementById('app');
const authResponse = document.getElementById('authResponse');
const responseEl = document.getElementById('response');
const usernameEl = document.getElementById('username');
const logoutBtn = document.getElementById('logout');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');
const profileDiv = document.getElementById('profile');

const API_URL = 'http://my-business-app-env-east.us-east-1.elasticbeanstalk.com';

let token = localStorage.getItem('token');

if (token) {
  showApp();
  loadProfile();
  loadInputs();
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    authResponse.textContent = result.success ? 'Registered! Please login.' : result.error;
    authResponse.style.color = result.success ? 'green' : 'red';
  } catch (err) {
    authResponse.textContent = `Error: ${err.message}`;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    if (result.success) {
      token = result.token;
      localStorage.setItem('token', token);
      usernameEl.textContent = username;
      showApp();
      loadProfile();
      loadInputs();
    } else {
      authResponse.textContent = result.error;
    }
  } catch (err) {
    authResponse.textContent = `Error: ${err.message}`;
  }
});

inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = document.getElementById('dataInput').value;
  const category = document.getElementById('category').value;
  try {
    const res = await fetch(`${API_URL}/api/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data, category })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('dataInput').value = '';
      loadInputs();
    } else {
      responseEl.textContent = `Error: ${result.error}`;
      responseEl.style.color = 'red';
    }
  } catch (err) {
    responseEl.textContent = `Error: ${err.message}`;
    responseEl.style.color = 'red';
  }
});

searchBtn.addEventListener('click', () => loadInputs(searchInput.value));
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  loadInputs();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  token = null;
  authDiv.style.display = 'block';
  appDiv.style.display = 'none';
  authResponse.textContent = 'Logged out';
  authResponse.style.color = 'green';
});

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profile = await res.json();
    profileDiv.innerHTML = `Username: ${profile.username}<br>Joined: ${new Date(profile.createdAt).toLocaleString()}`;
  } catch (err) {
    profileDiv.textContent = `Failed to load profile: ${err.message}`;
  }
}

async function loadInputs(search = '') {
  try {
    const url = search ? `${API_URL}/api/inputs?search=${encodeURIComponent(search)}` : `${API_URL}/api/inputs`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const inputs = await res.json();
    responseEl.innerHTML = inputs.map(i => `
      <div class="input-item">
        <span>${i.data} (${i.category}) - ${new Date(i.timestamp).toLocaleString()}</span>
        <button onclick="editInput('${i._id}', '${i.data}', '${i.category}')">Edit</button>
        <button onclick="deleteInput('${i._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    responseEl.textContent = `Failed to load inputs: ${err.message}`;
    responseEl.style.color = 'red';
  }
}

async function editInput(id, currentData, currentCategory) {
  const data = prompt('Edit data:', currentData);
  if (data === null) return;
  const category = prompt('Edit category (General, Work, Personal):', currentCategory) || currentCategory;
  try {
    const res = await fetch(`${API_URL}/api/input/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data, category })
    });
    const result = await res.json();
    if (result.success) loadInputs(searchInput.value);
    else responseEl.textContent = `Error: ${result.error}`;
  } catch (err) {
    responseEl.textContent = `Error: ${err.message}`;
  }
}

async function deleteInput(id) {
  if (!confirm('Are you sure you want to delete this input?')) return;
  try {
    const res = await fetch(`${API_URL}/api/input/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) loadInputs(searchInput.value);
    else responseEl.textContent = `Error: ${result.error}`;
  } catch (err) {
    responseEl.textContent = `Error: ${err.message}`;
  }
}

function showApp() {
  authDiv.style.display = 'none';
  appDiv.style.display = 'block';
  authResponse.textContent = '';
}


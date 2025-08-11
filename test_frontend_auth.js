// Test frontend authentication flow
console.log('Testing frontend authentication...');

fetch('/api/auth/user', {
  credentials: 'include'
})
.then(response => {
  console.log('Auth status:', response.status);
  return response.json();
})
.then(data => {
  console.log('User data:', data);
})
.catch(error => {
  console.error('Auth error:', error);
});

// Test WebSocket connection
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws`;
console.log('Connecting to WebSocket:', wsUrl);

const socket = new WebSocket(wsUrl);

socket.onopen = function(event) {
  console.log('✅ WebSocket connected');
};

socket.onmessage = function(event) {
  console.log('📡 WebSocket message:', JSON.parse(event.data));
};

socket.onerror = function(error) {
  console.error('❌ WebSocket error:', error);
};

socket.onclose = function(event) {
  console.log('🔌 WebSocket closed:', event.code, event.reason);
};
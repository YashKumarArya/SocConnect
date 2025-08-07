// Demo script to show normalization working
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNormalization() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Alert Normalization System\n');
  
  // Test data from your JSON files
  const crowdStrikeAlert = {
    "alert_id": "demo-cs-001",
    "detect_id": "detect-demo-001", 
    "device_name": "demo-workstation-01",
    "ip_address": "192.168.1.100",
    "user_name": "demo_user",
    "file_name": "suspicious.exe",
    "file_path": "C:\\Temp\\suspicious.exe",
    "file_hash_sha256": "abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234",
    "severity": "High",
    "tactic": "Defense Evasion",
    "technique": "T1547",
    "detect_name": "RemoteAccessTool",
    "command_line": "suspicious.exe --backdoor",
    "timestamp": new Date().toISOString(),
    "event_platform": "Windows",
    "event_type": "ProcessRollup",
    "network_remote_ip": "203.0.113.10",
    "network_remote_port": 8080,
    "protocol": "TCP"
  };

  const emailAlert = {
    "alert_id": "demo-email-001",
    "sender_email": "phishing@badactor.com",
    "recipient_email": "user@company.com",
    "subject": "URGENT: Verify Your Account",
    "timestamp": new Date().toISOString(),
    "verdict": "malicious",
    "malware_detected": "Emotet",
    "phishing_detected": true,
    "spam_score": 8.5,
    "attachment_name": "invoice.pdf.exe",
    "detection_engine": "Microsoft Defender"
  };

  const firewallAlert = {
    "alert_id": "demo-fw-001",
    "firewall_name": "perimeter-fw-01",
    "src_ip": "203.0.113.50",
    "dest_ip": "192.168.1.200",
    "protocol": "TCP",
    "action": "deny",
    "threat_type": "port-scan",
    "severity": "Medium",
    "timestamp": new Date().toISOString(),
    "application": "SSH"
  };

  // Test normalization for each type
  const testCases = [
    { name: 'CrowdStrike EDR', data: crowdStrikeAlert, type: 'crowdstrike' },
    { name: 'Email Security', data: emailAlert, type: 'email' },
    { name: 'Firewall', data: firewallAlert, type: 'firewall' }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Testing ${testCase.name} Alert:`);
    console.log('Original:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await fetch(`${baseUrl}/api/alerts/test-normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertData: testCase.data,
          sourceType: testCase.type
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Normalized:', JSON.stringify(result.normalized, null, 2));
      } else {
        console.log('❌ Error:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
    
    console.log('\n' + '─'.repeat(80) + '\n');
  }
}

console.log('Starting normalization demo...');
testNormalization().catch(console.error);
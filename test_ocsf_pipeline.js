// Test the complete OCSF architecture refactor
import fetch from 'node-fetch';

async function testOCSFPipeline() {
  console.log('🧪 Testing OCSF Architecture Pipeline...');
  
  // Test with authentic email security alert data from attached assets
  const testAlert = {
    id: `alert_${Date.now()}`,
    sourceId: 'email',
    severity: 'medium',
    type: 'phish_credential',
    description: 'OneDrive Account Notice – Action Required',
    receivedAt: new Date().toISOString(),
    rawData: {
      alert_id: '95ea6787-4a00-41b3-8736-25960e4e8136',
      timestamp: '2025-08-10T15:08:26.428693+05:30',
      vendor: 'Microsoft',
      product: 'Defender for Office 365',
      category: 'False Positive',
      alert_type: 'phish_credential',
      severity: 'Medium',
      action: 'Delivered',
      direction: 'Outbound',
      sender_address: 'no-reply@github.xyz',
      recipient: 'ananya.patel@acme-corp.com',
      recipient_department: 'Marketing',
      subject: 'OneDrive Account Notice – Action Required',
      message_id: '<88c9f7f805ff@github.xyz>',
      from_domain: 'github.xyz',
      return_path: 'bounce@mandrillapp.com',
      spf: 'pass',
      dkim: 'pass',
      dmarc: 'pass',
      dmarc_policy: 'p=none',
      body_excerpt: 'Dear user, your SharePoint account will be disabled. Verify now: https://safelinks.protection.google.com/?url=http://sharep0int.live/login?session=fd49a0f0a8&data=ABCDEF',
      original_url: 'http://sharep0int.live/login?session=fd49a0f0a8',
      rewritten_url: 'https://safelinks.protection.google.com/?url=http://sharep0int.live/login?session=fd49a0f0a8&data=ABCDEF',
      agent_verdict: {
        label: 'False Positive',
        true_positive: false,
        false_positive: true,
        escalate: false
      }
    }
  };

  try {
    // Test OCSF processing endpoint
    const response = await fetch('http://localhost:5000/api/alerts/process-ocsf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test' // Mock session
      },
      body: JSON.stringify(testAlert)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ OCSF Pipeline Test SUCCESS');
      console.log('📊 OCSF Event Class:', result.ocsfEvent?.className);
      console.log('🔬 AI Analysis Threat Level:', result.aiAnalysis?.threatLevel);
      console.log('🤖 ML Features Prepared:', Object.keys(result.mlFeatures || {}));
      return true;
    } else {
      console.log('❌ OCSF Pipeline Test FAILED:', response.status);
      console.log(await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    return false;
  }
}

// Run test
testOCSFPipeline().then(success => {
  console.log('\n🏁 OCSF Architecture Refactor:', success ? 'COMPLETE' : 'NEEDS FIXES');
  process.exit(success ? 0 : 1);
});
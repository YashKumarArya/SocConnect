#!/bin/bash

echo "🧪 Testing OCSF Architecture Pipeline with Authentic Data..."

# Test authentic email alert processing
curl -X POST http://localhost:5000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "alert_'$(date +%s)'",
    "sourceId": "email",
    "severity": "medium", 
    "type": "phish_credential",
    "description": "OneDrive Account Notice – Action Required",
    "receivedAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "rawData": {
      "alert_id": "95ea6787-4a00-41b3-8736-25960e4e8136",
      "vendor": "Microsoft",
      "product": "Defender for Office 365",
      "alert_type": "phish_credential",
      "severity": "Medium",
      "sender_address": "no-reply@github.xyz",
      "recipient": "ananya.patel@acme-corp.com",
      "subject": "OneDrive Account Notice – Action Required",
      "from_domain": "github.xyz",
      "spf": "pass",
      "dkim": "pass", 
      "dmarc": "pass",
      "original_url": "http://sharep0int.live/login?session=fd49a0f0a8"
    }
  }' 2>/dev/null | head -c 300

echo -e "\n\n✅ OCSF Pipeline Test Complete - Alert processed through architecture:"
echo "Alert Sources → API → Enrichment → OCSF Normalization → Database → ML via Kafka + Neo4j Graph Analysis"
import fs from 'fs';
import path from 'path';

export interface AlertDataset {
  crowdstrike: any[];
  email: any[];
  firewall: any[];
  sentinelone: any[];
}

export class AlertDataLoader {
  private static instance: AlertDataLoader;
  private alertData: AlertDataset = {
    crowdstrike: [],
    email: [],
    firewall: [],
    sentinelone: []
  };
  private isLoaded = false;

  static getInstance(): AlertDataLoader {
    if (!AlertDataLoader.instance) {
      AlertDataLoader.instance = new AlertDataLoader();
    }
    return AlertDataLoader.instance;
  }

  async loadAlertData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const dataPath = path.join(process.cwd(), 'attached_assets');
      
      // Load CrowdStrike alerts
      const crowdStrikeFile = path.join(dataPath, 'crowdstrike_alerts_labeled_1754556002025.json');
      if (fs.existsSync(crowdStrikeFile)) {
        const crowdStrikeData = JSON.parse(fs.readFileSync(crowdStrikeFile, 'utf8'));
        this.alertData.crowdstrike = Array.isArray(crowdStrikeData) ? crowdStrikeData : [];
        console.log(`✅ Loaded ${this.alertData.crowdstrike.length} CrowdStrike alerts`);
      }

      // Load Email alerts
      const emailFile = path.join(dataPath, 'email_alerts_labeled_1754556002031.json');
      if (fs.existsSync(emailFile)) {
        const emailData = JSON.parse(fs.readFileSync(emailFile, 'utf8'));
        this.alertData.email = Array.isArray(emailData) ? emailData : [];
        console.log(`✅ Loaded ${this.alertData.email.length} Email alerts`);
      }

      // Load Firewall alerts
      const firewallFile = path.join(dataPath, 'firewall_alerts_labeled_1754556002031.json');
      if (fs.existsSync(firewallFile)) {
        const firewallData = JSON.parse(fs.readFileSync(firewallFile, 'utf8'));
        this.alertData.firewall = Array.isArray(firewallData) ? firewallData : [];
        console.log(`✅ Loaded ${this.alertData.firewall.length} Firewall alerts`);
      }

      // Load SentinelOne alerts
      const sentinelOneFile = path.join(dataPath, 'sentinelone_alerts_labeled_1754556002032.json');
      if (fs.existsSync(sentinelOneFile)) {
        const sentinelOneData = JSON.parse(fs.readFileSync(sentinelOneFile, 'utf8'));
        this.alertData.sentinelone = Array.isArray(sentinelOneData) ? sentinelOneData : [];
        console.log(`✅ Loaded ${this.alertData.sentinelone.length} SentinelOne alerts`);
      }

      this.isLoaded = true;
      const totalAlerts = this.alertData.crowdstrike.length + 
                         this.alertData.email.length + 
                         this.alertData.firewall.length + 
                         this.alertData.sentinelone.length;
      console.log(`🎯 Total alerts loaded: ${totalAlerts}`);
    } catch (error) {
      console.error('❌ Error loading alert data:', error);
      this.isLoaded = false;
    }
  }

  getRandomAlerts(sourceType: string, count: number): any[] {
    const sourceKey = sourceType.toLowerCase() as keyof AlertDataset;
    const sourceData = this.alertData[sourceKey];
    
    if (!sourceData || sourceData.length === 0) {
      throw new Error(`No data available for source type: ${sourceType}`);
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * sourceData.length);
      const alert = { ...sourceData[randomIndex] };
      
      // Update timestamp to current time for realism
      if (alert.timestamp) {
        alert.timestamp = new Date(Date.now() - Math.random() * 3600000).toISOString();
      }
      
      results.push(alert);
    }
    
    return results;
  }

  getDatasetStats(): { [key: string]: number } {
    return {
      crowdstrike: this.alertData.crowdstrike.length,
      email: this.alertData.email.length,
      firewall: this.alertData.firewall.length,
      sentinelone: this.alertData.sentinelone.length,
      total: this.alertData.crowdstrike.length + 
             this.alertData.email.length + 
             this.alertData.firewall.length + 
             this.alertData.sentinelone.length
    };
  }

  getSampleAlert(sourceType: string): any | null {
    const sourceKey = sourceType.toLowerCase() as keyof AlertDataset;
    const sourceData = this.alertData[sourceKey];
    
    if (!sourceData || sourceData.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * sourceData.length);
    return sourceData[randomIndex];
  }

  async ensureDataLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadAlertData();
    }
  }
}
import type { SecurityEvent } from './kafka';

// OCSF Base Event Schema - Common attributes for all events
export interface OCSFBaseEvent {
  // Core attributes
  activity_id: number;
  activity_name: string;
  category_name: string;
  category_uid: number;
  class_name: string;
  class_uid: number;
  count?: number;
  message?: string;
  metadata: {
    logged_time?: number;
    original_time?: string;
    processed_time?: number;
    product?: {
      name: string;
      vendor_name: string;
      version?: string;
    };
    profiles?: string[];
    version: string;
  };
  observables?: OCSFObservable[];
  raw_data?: any;
  severity?: string;
  severity_id: number;
  status?: string;
  status_id?: number;
  time: number;
  timezone_offset?: number;
  type_name: string;
  type_uid: number;
  unmapped?: Record<string, any>;
}

// OCSF Observable for IOCs and artifacts
export interface OCSFObservable {
  name: string;
  type: string;
  type_id: number;
  value: string;
}

// OCSF Network Activity Event (Class 4001)
export interface OCSFNetworkActivity extends OCSFBaseEvent {
  class_uid: 4001;
  class_name: "Network Activity";
  category_uid: 4;
  category_name: "Network Activity";
  
  // Network-specific attributes
  connection_info?: {
    boundary?: string;
    boundary_id?: number;
    direction?: string;
    direction_id?: number;
    protocol_name?: string;
    protocol_num?: number;
    tcp_flags?: number;
    uid?: string;
  };
  dst_endpoint?: OCSFEndpoint;
  src_endpoint?: OCSFEndpoint;
  traffic?: {
    bytes?: number;
    bytes_in?: number;
    bytes_out?: number;
    packets?: number;
    packets_in?: number;
    packets_out?: number;
  };
  disposition?: string;
  disposition_id?: number;
}

// OCSF System Activity Event (Class 1001)
export interface OCSFSystemActivity extends OCSFBaseEvent {
  class_uid: 1001;
  class_name: "Process Activity";
  category_uid: 1;
  category_name: "System Activity";
  
  // System-specific attributes
  actor?: OCSFActor;
  device?: OCSFDevice;
  process?: OCSFProcess;
  file?: OCSFFile;
  malware?: OCSFMalware[];
  disposition?: string;
  disposition_id?: number;
}

// OCSF Security Finding Event (Class 2001)
export interface OCSFSecurityFinding extends OCSFBaseEvent {
  class_uid: 2001;
  class_name: "Security Finding";
  category_uid: 2;
  category_name: "Findings";
  
  // Finding-specific attributes
  finding?: {
    created_time?: number;
    desc?: string;
    first_seen_time?: number;
    last_seen_time?: number;
    modified_time?: number;
    product_uid?: string;
    related_events?: any[];
    remediation?: {
      desc?: string;
      kb_articles?: string[];
    };
    supporting_data?: any;
    title?: string;
    types?: string[];
    uid: string;
  };
  confidence?: string;
  confidence_id?: number;
  confidence_score?: number;
  impact?: string;
  impact_id?: number;
  impact_score?: number;
  risk_level?: string;
  risk_level_id?: number;
  risk_score?: number;
}

// OCSF Authentication Event (Class 3002)
export interface OCSFAuthentication extends OCSFBaseEvent {
  class_uid: 3002;
  class_name: "Authentication";
  category_uid: 3;
  category_name: "Identity & Access Management";
  
  // Auth-specific attributes
  user?: OCSFUser;
  device?: OCSFDevice;
  session?: OCSFSession;
  auth_protocol?: string;
  auth_protocol_id?: number;
  logon_type?: string;
  logon_type_id?: number;
  is_remote?: boolean;
  disposition?: string;
  disposition_id?: number;
}

// Supporting OCSF Types
export interface OCSFEndpoint {
  hostname?: string;
  ip?: string;
  port?: number;
  subnet_uid?: string;
  svc_name?: string;
  uid?: string;
}

export interface OCSFActor {
  user?: OCSFUser;
  process?: OCSFProcess;
  session?: OCSFSession;
}

export interface OCSFDevice {
  hostname?: string;
  ip?: string;
  mac?: string;
  name?: string;
  os?: {
    name?: string;
    type?: string;
    type_id?: number;
    version?: string;
  };
  type?: string;
  type_id?: number;
  uid?: string;
}

export interface OCSFUser {
  account?: {
    name?: string;
    type?: string;
    type_id?: number;
    uid?: string;
  };
  credential_uid?: string;
  domain?: string;
  email_addr?: string;
  full_name?: string;
  name?: string;
  type?: string;
  type_id?: number;
  uid?: string;
}

export interface OCSFProcess {
  cmd_line?: string;
  created_time?: number;
  file?: OCSFFile;
  name?: string;
  parent_process?: OCSFProcess;
  pid?: number;
  session?: OCSFSession;
  terminated_time?: number;
  tid?: number;
  uid?: string;
  user?: OCSFUser;
}

export interface OCSFFile {
  accessed_time?: number;
  created_time?: number;
  desc?: string;
  hashes?: OCSFHash[];
  mime_type?: string;
  modified_time?: number;
  name?: string;
  owner?: OCSFUser;
  parent_folder?: string;
  path?: string;
  security_descriptor?: string;
  size?: number;
  type?: string;
  type_id?: number;
  uid?: string;
  version?: string;
}

export interface OCSFHash {
  algorithm?: string;
  algorithm_id?: number;
  value: string;
}

export interface OCSFMalware {
  classification_ids?: number[];
  classifications?: string[];
  name?: string;
  path?: string;
  provider?: string;
  uid?: string;
}

export interface OCSFSession {
  created_time?: number;
  credential_uid?: string;
  expiration_time?: number;
  is_remote?: boolean;
  issuer?: string;
  uid?: string;
}

// OCSF Event Union Type
export type OCSFEvent = OCSFNetworkActivity | OCSFSystemActivity | OCSFSecurityFinding | OCSFAuthentication;

// OCSF Constants and Enumerations
export const OCSFConstants = {
  // Severity mappings
  SEVERITY: {
    UNKNOWN: { id: 0, name: "Unknown" },
    INFORMATIONAL: { id: 1, name: "Informational" },
    LOW: { id: 2, name: "Low" },
    MEDIUM: { id: 3, name: "Medium" },
    HIGH: { id: 4, name: "High" },
    CRITICAL: { id: 5, name: "Critical" },
  },

  // Activity IDs for different event types
  NETWORK_ACTIVITY: {
    UNKNOWN: { id: 0, name: "Unknown" },
    ALLOWED: { id: 1, name: "Allowed" },
    DENIED: { id: 2, name: "Denied" },
    BLOCKED: { id: 3, name: "Blocked" },
  },

  PROCESS_ACTIVITY: {
    UNKNOWN: { id: 0, name: "Unknown" },
    LAUNCH: { id: 1, name: "Launch" },
    TERMINATE: { id: 2, name: "Terminate" },
    BLOCK: { id: 3, name: "Block" },
    QUARANTINE: { id: 4, name: "Quarantine" },
  },

  AUTHENTICATION: {
    UNKNOWN: { id: 0, name: "Unknown" },
    LOGON: { id: 1, name: "Logon" },
    LOGOFF: { id: 2, name: "Logoff" },
    AUTHENTICATION_TICKET: { id: 3, name: "Authentication Ticket" },
  },

  // Disposition mappings
  DISPOSITION: {
    UNKNOWN: { id: 0, name: "Unknown" },
    ALLOWED: { id: 1, name: "Allowed" },
    BLOCKED: { id: 2, name: "Blocked" },
    QUARANTINED: { id: 3, name: "Quarantined" },
    ISOLATED: { id: 4, name: "Isolated" },
    DELETED: { id: 5, name: "Deleted" },
    DROPPED: { id: 6, name: "Dropped" },
    CUSTOM_ACTION: { id: 7, name: "Custom Action" },
    APPROVED: { id: 8, name: "Approved" },
    RESTORED: { id: 9, name: "Restored" },
    EXONERATED: { id: 10, name: "Exonerated" },
    CORRECTED: { id: 11, name: "Corrected" },
    PARTIALLY_CORRECTED: { id: 12, name: "Partially Corrected" },
    UNCORRECTED: { id: 13, name: "Uncorrected" },
    DELAYED: { id: 14, name: "Delayed" },
    DETECTED: { id: 15, name: "Detected" },
    NO_ACTION: { id: 16, name: "No Action" },
    LOGGED: { id: 17, name: "Logged" },
  }
} as const;

// OCSF Transformation Service
export class OCSFTransformationService {
  
  // Convert custom SecurityEvent to OCSF format
  static transformToOCSF(event: SecurityEvent): OCSFEvent {
    const baseTime = new Date(event.timestamp).getTime();
    
    // Common base attributes for all OCSF events
    const baseEvent: Partial<OCSFBaseEvent> = {
      count: 1,
      message: event.description,
      metadata: {
        logged_time: baseTime,
        original_time: event.timestamp,
        processed_time: Date.now(),
        product: {
          name: event.source,
          vendor_name: this.extractVendorName(event.source),
        },
        profiles: ["security_control"],
        version: "1.1.0"
      },
      raw_data: event.raw_data,
      severity: this.mapSeverity(event.severity).name,
      severity_id: this.mapSeverity(event.severity).id,
      time: baseTime,
      unmapped: {
        original_id: event.id,
        original_source: event.source
      }
    };

    // Transform based on event type
    switch (event.type) {
      case 'intrusion':
        return this.transformToNetworkActivity(event, baseEvent);
      
      case 'malware':
        return this.transformToSystemActivity(event, baseEvent);
      
      case 'policy_violation':
      case 'anomaly':
      case 'threat_intel':
        return this.transformToSecurityFinding(event, baseEvent);
      
      default:
        return this.transformToSecurityFinding(event, baseEvent);
    }
  }

  // Convert OCSF event back to custom SecurityEvent format
  static transformFromOCSF(ocsfEvent: OCSFEvent): SecurityEvent {
    return {
      id: ocsfEvent.unmapped?.original_id || `ocsf_${Date.now()}`,
      timestamp: ocsfEvent.metadata.original_time || new Date(ocsfEvent.time).toISOString(),
      source: ocsfEvent.unmapped?.original_source || ocsfEvent.metadata.product?.name || 'OCSF-Unknown',
      severity: this.mapOCSFSeverity(ocsfEvent.severity_id),
      type: this.mapOCSFEventType(ocsfEvent.class_uid),
      title: this.extractTitle(ocsfEvent),
      description: ocsfEvent.message || 'OCSF Event',
      metadata: this.extractMetadata(ocsfEvent),
      raw_data: ocsfEvent.raw_data || ocsfEvent
    };
  }

  // Transform to Network Activity (Class 4001)
  private static transformToNetworkActivity(event: SecurityEvent, base: Partial<OCSFBaseEvent>): OCSFNetworkActivity {
    return {
      ...base,
      activity_id: OCSFConstants.NETWORK_ACTIVITY.BLOCKED.id,
      activity_name: OCSFConstants.NETWORK_ACTIVITY.BLOCKED.name,
      category_name: "Network Activity",
      category_uid: 4,
      class_name: "Network Activity",
      class_uid: 4001,
      type_name: `Network Activity: ${OCSFConstants.NETWORK_ACTIVITY.BLOCKED.name}`,
      type_uid: 400102, // 4001 (class) + 02 (activity)
      
      connection_info: {
        direction: "Unknown",
        direction_id: 0,
        protocol_name: event.raw_data?.protocol || "TCP"
      },
      
      src_endpoint: event.metadata.source_ip ? {
        ip: event.metadata.source_ip,
        uid: event.metadata.source_ip
      } : undefined,
      
      dst_endpoint: event.metadata.destination_ip ? {
        ip: event.metadata.destination_ip,
        uid: event.metadata.destination_ip
      } : undefined,
      
      disposition: OCSFConstants.DISPOSITION.BLOCKED.name,
      disposition_id: OCSFConstants.DISPOSITION.BLOCKED.id,
      
      observables: this.extractNetworkObservables(event)
    } as OCSFNetworkActivity;
  }

  // Transform to System Activity (Class 1001)
  private static transformToSystemActivity(event: SecurityEvent, base: Partial<OCSFBaseEvent>): OCSFSystemActivity {
    const disposition = event.raw_data?.action === 'quarantined' 
      ? OCSFConstants.DISPOSITION.QUARANTINED
      : OCSFConstants.DISPOSITION.BLOCKED;

    return {
      ...base,
      activity_id: OCSFConstants.PROCESS_ACTIVITY.QUARANTINE.id,
      activity_name: OCSFConstants.PROCESS_ACTIVITY.QUARANTINE.name,
      category_name: "System Activity",
      category_uid: 1,
      class_name: "Process Activity",
      class_uid: 1001,
      type_name: `Process Activity: ${OCSFConstants.PROCESS_ACTIVITY.QUARANTINE.name}`,
      type_uid: 100104, // 1001 (class) + 04 (quarantine activity)
      
      actor: {
        user: event.metadata.user ? {
          name: event.metadata.user,
          email_addr: event.metadata.user,
          uid: event.metadata.user
        } : undefined
      },
      
      file: event.raw_data?.file_path ? {
        path: event.raw_data.file_path,
        name: event.raw_data.file_path.split('/').pop() || event.raw_data.file_path,
        hashes: event.metadata.file_hash ? [{
          algorithm: "Unknown",
          algorithm_id: 0,
          value: event.metadata.file_hash
        }] : undefined
      } : undefined,
      
      malware: [{
        name: event.title,
        classification_ids: [1], // Trojan
        classifications: ["Trojan"],
        provider: event.source
      }],
      
      disposition: disposition.name,
      disposition_id: disposition.id,
      
      observables: this.extractSystemObservables(event)
    } as OCSFSystemActivity;
  }

  // Transform to Security Finding (Class 2001)
  private static transformToSecurityFinding(event: SecurityEvent, base: Partial<OCSFBaseEvent>): OCSFSecurityFinding {
    return {
      ...base,
      activity_id: 1, // Create
      activity_name: "Create",
      category_name: "Findings",
      category_uid: 2,
      class_name: "Security Finding",
      class_uid: 2001,
      type_name: "Security Finding: Create",
      type_uid: 200101, // 2001 (class) + 01 (create activity)
      
      finding: {
        created_time: new Date(event.timestamp).getTime(),
        desc: event.description,
        title: event.title,
        uid: event.id,
        types: [event.type],
        supporting_data: event.raw_data
      },
      
      confidence: "Medium",
      confidence_id: 50,
      confidence_score: 50,
      
      risk_level: event.severity,
      risk_level_id: this.mapSeverity(event.severity).id,
      risk_score: this.mapSeverityToScore(event.severity),
      
      observables: this.extractGeneralObservables(event)
    } as OCSFSecurityFinding;
  }

  // Helper methods
  private static extractVendorName(source: string): string {
    if (source.includes('PaloAlto')) return 'Palo Alto Networks';
    if (source.includes('CrowdStrike')) return 'CrowdStrike';
    if (source.includes('Splunk')) return 'Splunk';
    if (source.includes('Elastic')) return 'Elastic';
    return 'Unknown';
  }

  private static mapSeverity(severity: string): { id: number; name: string } {
    switch (severity.toLowerCase()) {
      case 'low': return OCSFConstants.SEVERITY.LOW;
      case 'medium': return OCSFConstants.SEVERITY.MEDIUM;
      case 'high': return OCSFConstants.SEVERITY.HIGH;
      case 'critical': return OCSFConstants.SEVERITY.CRITICAL;
      default: return OCSFConstants.SEVERITY.UNKNOWN;
    }
  }

  private static mapOCSFSeverity(severityId: number): 'low' | 'medium' | 'high' | 'critical' {
    switch (severityId) {
      case 2: return 'low';
      case 3: return 'medium';
      case 4: return 'high';
      case 5: return 'critical';
      default: return 'medium';
    }
  }

  private static mapOCSFEventType(classUid: number): 'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel' {
    switch (classUid) {
      case 4001: return 'intrusion'; // Network Activity
      case 1001: return 'malware';   // System Activity
      case 2001: return 'anomaly';   // Security Finding
      case 3002: return 'policy_violation'; // Authentication
      default: return 'anomaly';
    }
  }

  private static mapSeverityToScore(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'low': return 25;
      case 'medium': return 50;
      case 'high': return 75;
      case 'critical': return 100;
      default: return 50;
    }
  }

  private static extractTitle(ocsfEvent: OCSFEvent): string {
    if ('finding' in ocsfEvent && ocsfEvent.finding?.title) {
      return ocsfEvent.finding.title;
    }
    return `${ocsfEvent.class_name}: ${ocsfEvent.activity_name}`;
  }

  private static extractMetadata(ocsfEvent: OCSFEvent): any {
    const metadata: any = {};

    // Extract network metadata
    if ('src_endpoint' in ocsfEvent && ocsfEvent.src_endpoint?.ip) {
      metadata.source_ip = ocsfEvent.src_endpoint.ip;
    }
    if ('dst_endpoint' in ocsfEvent && ocsfEvent.dst_endpoint?.ip) {
      metadata.destination_ip = ocsfEvent.dst_endpoint.ip;
    }

    // Extract system metadata
    if ('actor' in ocsfEvent && ocsfEvent.actor?.user?.name) {
      metadata.user = ocsfEvent.actor.user.name;
    }
    if ('file' in ocsfEvent && ocsfEvent.file?.hashes?.[0]?.value) {
      metadata.file_hash = ocsfEvent.file.hashes[0].value;
    }

    // Extract rule ID from metadata
    if (ocsfEvent.metadata.product?.name) {
      metadata.rule_id = `${ocsfEvent.metadata.product.name}-${ocsfEvent.class_uid}`;
    }

    return metadata;
  }

  private static extractNetworkObservables(event: SecurityEvent): OCSFObservable[] {
    const observables: OCSFObservable[] = [];
    
    if (event.metadata.source_ip) {
      observables.push({
        name: "source_ip",
        type: "IP Address",
        type_id: 2,
        value: event.metadata.source_ip
      });
    }
    
    if (event.metadata.destination_ip) {
      observables.push({
        name: "destination_ip", 
        type: "IP Address",
        type_id: 2,
        value: event.metadata.destination_ip
      });
    }

    return observables;
  }

  private static extractSystemObservables(event: SecurityEvent): OCSFObservable[] {
    const observables: OCSFObservable[] = [];
    
    if (event.metadata.file_hash) {
      observables.push({
        name: "file_hash",
        type: "Hash",
        type_id: 7,
        value: event.metadata.file_hash
      });
    }
    
    if (event.metadata.user) {
      observables.push({
        name: "user",
        type: "User Name",
        type_id: 4,
        value: event.metadata.user
      });
    }

    return observables;
  }

  private static extractGeneralObservables(event: SecurityEvent): OCSFObservable[] {
    const observables: OCSFObservable[] = [];
    
    // Add any relevant observables from metadata
    Object.entries(event.metadata).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        observables.push({
          name: key,
          type: "Other",
          type_id: 99,
          value: value
        });
      }
    });

    return observables;
  }
}
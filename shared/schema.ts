import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, real, uuid, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().$type<'analyst' | 'admin'>().default('analyst'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Sources table
export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g. EDR, SIEM
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Raw alerts table
export const rawAlerts = pgTable("raw_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  severity: text("severity"),
  type: text("type"),
  description: text("description"),
  rawData: jsonb("raw_data").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

// Normalized alerts table
export const normalizedAlerts = pgTable("normalized_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureVectorId: varchar("feature_vector_id").notNull().references(() => featureVectors.id, { onDelete: "cascade" }),
  decision: text("decision").notNull().$type<'AUTO' | 'MANUAL'>(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

// Feature vectors table
export const featureVectors = pgTable("feature_vectors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rawAlertId: varchar("raw_alert_id").notNull().references(() => rawAlerts.id, { onDelete: "cascade" }),
  features: jsonb("features").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  status: text("status").notNull().$type<'open' | 'investigating' | 'monitoring' | 'resolved'>().default('open'),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

// Actions table
export const actions = pgTable("actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(), // AUTO_QUARANTINE, ANALYST_REVIEW
  payload: jsonb("payload"),
  performedBy: text("performed_by"),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").references(() => normalizedAlerts.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedback: text("feedback").notNull(),
  rating: integer("rating"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

// Model metrics table
export const modelMetrics = pgTable("model_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runTs: timestamp("run_ts", { withTimezone: true }).notNull(),
  alertsProcessed: integer("alerts_processed").notNull(),
  autoActions: integer("auto_actions").notNull(),
  manualReviews: integer("manual_reviews").notNull(),
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  latencyMs: integer("latency_ms").notNull(),
});

// OCSF Events table - Store OCSF events with ML model attributes for 99.58% accuracy
export const ocsfEvents = pgTable("ocsf_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Core OCSF attributes (required by ML model)
  classUid: integer("class_uid").notNull(),
  className: text("class_name").notNull(),
  categoryUid: integer("category_uid").notNull(),
  categoryName: text("category_name").notNull(),
  activityId: integer("activity_id").notNull(),
  activityName: text("activity_name").notNull(),
  severityId: integer("severity_id").notNull(),
  severity: text("severity"),
  time: timestamp("time", { withTimezone: true }).notNull(),
  message: text("message"),
  
  // Network features (ML model attributes)
  srcIp: text("src_ip"), // Source IP address
  dstIp: text("dst_ip"), // Destination IP address
  
  // System features (ML model attributes)
  username: text("username"), // User involved in the event
  hostname: text("hostname"), // Host involved in the event
  
  // Security features (ML model attributes)
  dispositionId: integer("disposition_id"), // OCSF disposition
  confidenceScore: real("confidence_score"), // Confidence level
  
  // Metadata features (ML model attributes)
  productName: text("product_name"), // Product that generated the event
  vendorName: text("vendor_name"), // Vendor of the product
  
  // Storage
  rawData: jsonb("raw_data").notNull(),
  observables: jsonb("observables"), // Store OCSF observables as JSON
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  classUidIdx: index("ocsf_events_class_uid_idx").on(table.classUid),
  severityIdIdx: index("ocsf_events_severity_id_idx").on(table.severityId),
  timeIdx: index("ocsf_events_time_idx").on(table.time),
  srcIpIdx: index("ocsf_events_src_ip_idx").on(table.srcIp),
  dstIpIdx: index("ocsf_events_dst_ip_idx").on(table.dstIp),
  usernameIdx: index("ocsf_events_username_idx").on(table.username),
  hostnameIdx: index("ocsf_events_hostname_idx").on(table.hostname),
}));

// Enhanced normalized alerts table with ML model attributes for 99.58% accuracy
export const enhancedNormalizedAlerts = pgTable("enhanced_normalized_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: text("source_id").notNull(), // Source identifier
  originalId: text("original_id").notNull(), // Original event ID
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  severity: text("severity").notNull().$type<'low' | 'medium' | 'high' | 'critical'>(),
  alertType: text("alert_type").notNull().$type<'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel'>(),
  title: text("title").notNull(),
  description: text("description"),
  
  // ML Model Required Attributes (matching OCSF schema)
  classUid: integer("class_uid"), // OCSF class UID
  categoryUid: integer("category_uid"), // OCSF category UID
  activityId: integer("activity_id"), // OCSF activity ID
  severityId: integer("severity_id"), // OCSF severity ID
  
  // Network features (ML model attributes)
  srcIp: text("src_ip"), // Source IP address
  dstIp: text("dst_ip"), // Destination IP address
  
  // System features (ML model attributes)
  username: text("username"),
  hostname: text("hostname"),
  
  // Security features (ML model attributes)
  dispositionId: integer("disposition_id"), // OCSF disposition
  confidenceScore: real("confidence_score"), // Confidence level
  
  // Metadata features (ML model attributes)
  productName: text("product_name"), // Product that generated the event
  vendorName: text("vendor_name"), // Vendor of the product
  
  // Legacy fields for compatibility
  sourceIp: text("source_ip"), // Legacy field name
  destinationIp: text("destination_ip"), // Legacy field name
  ruleId: text("rule_id"),
  
  // Storage and management
  rawData: jsonb("raw_data"),
  ocsfEventId: varchar("ocsf_event_id").references(() => ocsfEvents.id), // Link to OCSF event if applicable
  status: text("status").notNull().$type<'open' | 'investigating' | 'closed' | 'false_positive'>().default('open'),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (table) => ({
  severityIdx: index("enhanced_alerts_severity_idx").on(table.severity),
  statusIdx: index("enhanced_alerts_status_idx").on(table.status),
  timestampIdx: index("enhanced_alerts_timestamp_idx").on(table.timestamp),
  sourceIdx: index("enhanced_alerts_source_idx").on(table.sourceId),
  classUidIdx: index("enhanced_alerts_class_uid_idx").on(table.classUid),
  severityIdIdx: index("enhanced_alerts_severity_id_idx").on(table.severityId),
  srcIpIdx: index("enhanced_alerts_src_ip_idx").on(table.srcIp),
  dstIpIdx: index("enhanced_alerts_dst_ip_idx").on(table.dstIp),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
});

export const insertRawAlertSchema = createInsertSchema(rawAlerts).omit({
  id: true,
  receivedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  performedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  submittedAt: true,
});

export const insertModelMetricSchema = createInsertSchema(modelMetrics).omit({
  id: true,
});

export const insertOCSFEventSchema = createInsertSchema(ocsfEvents).omit({
  id: true,
  createdAt: true,
});

export const insertEnhancedNormalizedAlertSchema = createInsertSchema(enhancedNormalizedAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = Omit<typeof users.$inferSelect, 'password'>; // Exclude password from public User type
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertRawAlert = z.infer<typeof insertRawAlertSchema>;
export type RawAlert = typeof rawAlerts.$inferSelect;
export type NormalizedAlert = typeof normalizedAlerts.$inferSelect;
export type FeatureVector = typeof featureVectors.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type ModelMetric = typeof modelMetrics.$inferSelect;
export type InsertModelMetric = z.infer<typeof insertModelMetricSchema>;
export type OCSFEvent = typeof ocsfEvents.$inferSelect;
export type InsertOCSFEvent = z.infer<typeof insertOCSFEventSchema>;
export type EnhancedNormalizedAlert = typeof enhancedNormalizedAlerts.$inferSelect;
export type InsertEnhancedNormalizedAlert = z.infer<typeof insertEnhancedNormalizedAlertSchema>;

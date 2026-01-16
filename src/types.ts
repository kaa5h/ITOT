// User Types
export type UserRole = 'IT' | 'OT' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site?: string;
}

// Asset Types
export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  company: string;
  plant: string;
  shop: string;
  line: string;
  station: string;
  owner: string;
}

// Template Types
export type FieldType = 'text' | 'number' | 'select' | 'textarea';

export interface TemplateField {
  name: string;
  type: FieldType;
  required: boolean;
  label: string;
  placeholder?: string;
  options?: string[];
}

export interface TemplateFieldGroup {
  name: string;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  name: string;
  protocol: string;
  status: 'active' | 'inactive';
  fields?: TemplateField[];
  fieldGroups?: TemplateFieldGroup[];
}

// Connection Types
export interface Connection {
  protocol?: string;
  host?: string;
  port?: number;
  otFilled?: boolean;
  // Authentication (references external secrets, does NOT store credentials)
  authMethod?: 'certificate' | 'username-password' | 'api-key' | 'oauth' | 'none';
  authReference?: string; // Reference to external secret (e.g., vault path, cert CN, key ID)
  authNote?: string; // Additional context (e.g., "Uses production PKI cert")
}

// Endpoint Types
export interface Endpoint {
  id: string;
  fields: Record<string, any>;
  completed: boolean;
  issueFlagged?: boolean;
  issueDescription?: string;
}

// Message Types
export interface Message {
  id: string;
  timestamp: string;
  from: string;
  role: UserRole;
  message: string;
  issueFlagged?: boolean;
  isResolution?: boolean;
}

// Request Status Types
export type RequestStatus =
  | 'draft'           // IT is writing the request
  | 'to-do'           // Sent to OT, not started yet
  | 'in-progress'     // OT is actively working
  | 'blocked'         // Cannot complete, needs IT decision
  | 'review'          // OT submitted, awaiting IT approval
  | 'complete'        // Approved and exported
  | 'cancelled';      // Request was cancelled

// Status History Entry
export interface StatusHistoryEntry {
  id: string;
  status: RequestStatus;
  timestamp: string;
  changedBy: string;
  reason?: string;
  note?: string;
}

// Block Information
export interface BlockInfo {
  reason: string;
  alternativeOffered: boolean;
  alternativeDescription?: string;
  blockedAt: string;
  blockedBy: string;
}

// Operations Settings (IT-defined, applies to all endpoints)
export interface OperationsSettings {
  subscribe: boolean;  // Can subscribe to real-time updates
  read: boolean;       // Can read values on demand
  write: boolean;      // Can write values to endpoints
}

// Validation Rule
export interface ValidationRule {
  fieldName: string;
  ruleType: 'regex' | 'format' | 'enum' | 'range';
  value: string | string[] | { min?: number; max?: number };
  errorMessage: string;
}

// Asset Selection (for multi-asset requests)
export interface AssetSelection {
  id: string;
  assetId: string;
  assetName: string;
  location: string;
  owner: string;
}

// Priority Types
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

// Activity Types
export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  action: string; // e.g., "changed status from pending to in-progress"
  details?: string;
}

// Notification Types
export type NotificationType =
  | 'request_created'
  | 'request_assigned'
  | 'status_changed'
  | 'new_comment'
  | 'request_submitted'
  | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  requestId: string;
  requestName: string;
  message: string;
  from: string;
  to: string;
  timestamp: string;
  read: boolean;
  link: string;
}

// Request Types
export interface Request {
  id: string;
  // Asset information (supports single or multiple assets)
  assetId: string; // Primary asset ID (for backward compatibility)
  assetName: string; // Primary asset name
  location: string; // Primary location
  selectedAssets?: AssetSelection[]; // Multi-asset selection (if applicable)

  status: RequestStatus;
  priority: Priority;
  createdBy: string;
  assignedTo: string; // Deprecated - kept for backward compatibility
  createdAt: string;
  updatedAt: string;

  // Email-based assignment (new system)
  recipientEmails?: string[]; // Email(s) IT entered when creating request
  requestToken?: string; // Unique token for shareable link
  claimedByEmail?: string; // Email of person who claimed the request
  claimedAt?: string; // When request was claimed
  requestUrl?: string; // Full shareable URL

  // IT-defined requirements
  description: string; // IT's conceptual description of what data is needed
  timeline?: string; // When IT needs the data
  estimatedDataPoints?: string; // Approximate number of data points
  operations?: OperationsSettings; // IT-defined operations (Subscribe/Read/Write) - applies globally
  validationRules?: ValidationRule[]; // IT-defined validation rules for OT input
  namingConvention?: string; // IT-defined naming convention template (e.g., "{Machine}_{Location}_{DataType}")

  // OT-filled information
  machineIdentifier?: string; // OT's machine ID (filled by OT)
  connection?: Connection; // Filled by OT
  endpoints: Endpoint[]; // Filled by OT
  customFields?: TemplateField[]; // OT-added custom columns for flexibility

  conversation: Message[];
  activity: Activity[];
  exportedAt?: string;
  exportId?: string;
  progressPercentage?: number;
  statusHistory?: StatusHistoryEntry[]; // Complete history of status changes (migrated automatically)
  blockInfo?: BlockInfo; // Information about current block (if status is 'blocked')
  needsITInput?: boolean; // Flag for "⚠️ Needs IT input" in discussions
  submittedAt?: string; // When OT submitted for review
  approvedAt?: string; // When IT approved
  approvedBy?: string; // Who approved
  cancelledAt?: string; // When cancelled
  cancelledBy?: string; // Who cancelled
  cancellationReason?: string; // Why cancelled
}

// Request Creation State (simplified for IT)
export interface RequestCreationState {
  step: number;
  selectedAsset?: Asset;
  description: string; // What data IT needs (conceptual)
  timeline: string; // When they need it
  estimatedDataPoints: string; // Approximate count
}

// App State
export interface AppState {
  currentUser: User;
  users: User[];
  assets: Asset[];
  templates: Template[];
  requests: Request[];
  notifications: Notification[];
  emails: Email[]; // Demo email inbox
  loggedInOTEmail: string | null; // Email of logged-in OT user (for demo)
  setCurrentUser: (user: User) => void;
  addRequest: (request: Request) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  addMessage: (requestId: string, message: Message) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addEmail: (email: Email) => void;
  markEmailRead: (id: string) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  loginOT: (email: string, password: string) => boolean;
  logoutOT: () => void;
}

// Email Types (for demo inbox simulation)
export interface Email {
  id: string;
  to: string; // Recipient email
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  requestId?: string; // Associated request ID
  requestToken?: string; // Token for request URL
  emailType: 'request_sent' | 'claim_confirmation' | 'submit_confirmation' | 'claimed_notification' | 'submitted_notification';
}

// Export Types
export type ExportFormat = 'json' | 'csv' | 'yaml';

export interface ExportData {
  export_id: string;
  request_id: string;
  timestamp: string;
  machine: {
    asset_id: string;
    name: string;
    type: string;
    location: string;
  };
  context: {
    requestor: string;
    description: string;
  };
  connection?: Connection;
  endpoints: any[];
  conversation_history: Message[];
  validation: {
    ot_completed: boolean;
    it_reviewed: boolean;
    tested: boolean;
  };
}

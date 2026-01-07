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
  site: string;
  building: string;
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
  | 'pending'
  | 'in-progress'
  | 'discussion-active'
  | 'blocked'
  | 'it-review'
  | 'complete';

// Request Types
export interface Request {
  id: string;
  assetId: string;
  assetName: string;
  location: string;
  status: RequestStatus;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  description: string; // IT's conceptual description of what data is needed
  timeline?: string; // When IT needs the data
  estimatedDataPoints?: string; // Approximate number of data points
  machineIdentifier?: string; // OT's machine ID (filled by OT)
  connection?: Connection; // Filled by OT
  endpoints: Endpoint[]; // Filled by OT
  conversation: Message[];
  exportedAt?: string;
  exportId?: string;
  progressPercentage?: number;
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
  setCurrentUser: (user: User) => void;
  addRequest: (request: Request) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  addMessage: (requestId: string, message: Message) => void;
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

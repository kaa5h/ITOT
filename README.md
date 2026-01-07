# IT/OT Collaboration Tool

A fully interactive prototype web application for IT engineers and OT (Operations Technology) personnel to collaborate on collecting machine integration data for IoT platform integration.

## Overview

This tool streamlines the process of collecting machine integration data by providing:
- Structured workflow with built-in communication
- Template-driven dynamic forms
- Progress tracking and validation
- Issue flagging and blocker management
- Export functionality for AI processing

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173`

## Key Features

### 1. Template-Driven Dynamic Forms
Forms automatically adapt based on the selected protocol:
- **Modbus TCP**: Simple spreadsheet-style table
- **OPC UA**: Complex expandable cards with field groups
- **Siemens S7**: Advanced grouped configuration
- View toggle between compact table and expandable cards

### 2. Connection/Endpoint Separation
- Connection parameters (host, port, protocol) specified ONCE
- All endpoints share the same connection
- Clear visual indicators showing parameter sharing

### 3. Inline Communication
- Split-view interface: form (60%) + chat (40%)
- Real-time messaging between IT and OT
- Full conversation history preserved
- Issue flagging integrated with chat

### 4. Progress Tracking
- Visual progress bars per endpoint
- Required field completion tracking
- Submit button enabled only when complete
- Overall progress percentage

### 5. Dashboard
- Filter by status, assignee, or search
- Grouped by status (pending, in-progress, blocked, etc.)
- Summary statistics
- Color-coded status badges

## User Flows

### Flow 1: IT Creates Request
1. **Asset Selection**: Search and select machine from asset registry
2. **Connection Config**: Choose protocol and configure connection
3. **Endpoint Definition**: Define data points using template-driven forms
4. **Review & Send**: Review summary and send to OT personnel

### Flow 2: OT Responds to Request
1. View request details and context
2. Fill in connection details (if needed)
3. Configure endpoints using split-view interface
4. Communicate with IT via inline chat
5. Mark issues/blockers if needed
6. Submit completed response to IT

### Flow 3: IT Reviews & Exports
1. Review OT's completed response
2. View conversation history
3. Accept response and export data
4. Choose format (JSON/CSV/YAML)
5. Send to AI for processing

### Flow 4: Admin Configuration
- Manage protocol templates
- Update fleet mapping
- Configure AI integration settings

## Demo/Testing

### User Switching
Use the dropdown in the header to switch between different user personas:
- **Maria Lopez (IT)**: IT engineer who creates requests
- **David Chen (IT)**: Another IT engineer
- **John Smith (OT)**: OT technician at Site 1 Building A
- **Sarah Jones (OT)**: OT technician at Site 1 Building B
- **Ahmed Hassan (OT)**: OT technician at Site 2
- **System Admin**: Administrator with access to configuration

### Testing Scenarios

#### Scenario 1: Simple Protocol (Modbus TCP)
1. Switch to "Maria Lopez (IT)"
2. Click "+ New Request" on dashboard
3. Select "ASSET-2847 - Temperature Control Unit"
4. Enter context and proceed
5. Select "Modbus TCP" protocol
6. See simple table interface
7. Fill 2 endpoints with required fields
8. Complete and send

#### Scenario 2: Complex Protocol (OPC UA)
1. Create new request
2. Select asset and choose "OPC UA"
3. See expandable card interface with field groups
4. Toggle between views (Compact Table ⟷ Expandable Cards)
5. Fill complex endpoint with grouped fields
6. Test expand/collapse functionality

#### Scenario 3: OT Response with Communication
1. Switch to "John Smith (OT)"
2. Open pending request from dashboard
3. Start filling information
4. Send message in chat panel
5. Mark issue on an endpoint
6. See issue appear in chat
7. Complete response and submit

#### Scenario 4: Full Flow End-to-End
1. As IT: Create and send request
2. Switch to OT: Respond with data and questions
3. Switch to IT: Review response
4. Export data to AI
5. View completion on dashboard

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx
│   ├── StatusBadge.tsx
│   └── ProgressBar.tsx
├── context/            # React Context for state management
│   ├── AppContext.tsx
│   └── RequestCreationContext.tsx
├── data/               # Dummy data
│   └── dummyData.ts
├── pages/              # Main page components
│   ├── Dashboard.tsx
│   ├── OTResponse.tsx
│   ├── ITReview.tsx
│   ├── ExportData.tsx
│   ├── admin/          # Admin pages
│   │   ├── Templates.tsx
│   │   ├── Fleet.tsx
│   │   └── AIConfig.tsx
│   └── create-request/ # IT request creation flow
│       ├── AssetSelection.tsx
│       ├── ConnectionConfig.tsx
│       ├── EndpointDefinition.tsx
│       └── ReviewAndSend.tsx
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## Dummy Data

The application includes realistic dummy data:
- **13 assets** across 3 sites
- **6 users** (IT, OT, Admin roles)
- **4 protocol templates** (Modbus TCP, OPC UA, Siemens S7, PROFINET)
- **13 requests** in various states (complete, in-progress, blocked, pending)
- **5 pre-written conversation threads** with realistic scenarios

## Notes

- **Data Persistence**: Data resets on page refresh (in-memory only)
- **No Backend**: All functionality is simulated client-side
- **Demo Purpose**: Built for user testing and stakeholder presentations
- **Simulated Delays**: Some actions have simulated delays for realism (e.g., connection test)

## Design Principles

1. **Template-Driven**: Forms adapt to protocol requirements
2. **Context Preservation**: All communication stays with the request
3. **Progressive Disclosure**: Simple by default, complex when needed
4. **Clear Progress**: Always know what's complete and what's remaining
5. **Issue Visibility**: Problems flagged immediately with context

## Future Enhancements (Out of Scope for Prototype)

- Real backend API integration
- Authentication system
- Real-time WebSocket communication
- Database persistence
- Automated service commissioning file generation
- Deployment to Connectware
- Post-export tracking

## License

This is a prototype/demo application built for evaluation purposes.

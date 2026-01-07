# IT/OT Information Ownership Refactor - IN PROGRESS

## Status: Partially Implemented

This refactor addresses the critical issue where IT was incorrectly filling in technical details (protocol, host/port, endpoints) that they wouldn't actually know.

## Completed Changes

### ✅ Types Updated
- Modified `Request` interface to include:
  - `description`: Conceptual data needs (replaces technical "context")
  - `timeline`: When IT needs the data
  - `estimatedDataPoints`: Approximate count
  - `machineIdentifier`: OT's internal machine ID
- Simplified `RequestCreationState` for IT's reduced responsibility
- Made `connection` optional (filled by OT, not IT)

### ✅ IT Request Creation Flow Simplified
- **Step 1**: Asset Selection (unchanged)
- **Step 2**: NEW - Data Description page (`/create-request/describe`)
  - Large text area for conceptual description
  - Guidance prompts for specificity
  - Timeline and estimated data points
  - NO protocol, host, port, or endpoints
- **Step 3**: Review & Send (simplified)
  - Shows description, timeline, estimated points
  - Explains OT will handle technical configuration

### ✅ Routes Updated
- Removed `/create-request/connection` and `/create-request/endpoints`
- Added `/create-request/describe`
- Updated `App.tsx` routing

## Remaining Work Needed

### 🔄 OT Response Page Refactor (CRITICAL)

The OT Response page needs complete refactor to handle:

#### 1. Initial View
Show IT's conceptual request prominently:
```
Integration Request from Maria Lopez (IT)

WHAT THEY NEED:
"Need outlet temperature from PRIMARY cooling loop (not secondary or
tertiary). This is the sensor measuring coolant as it exits the heat
exchanger. Will use for energy monitoring dashboard..."

Timeline: End of week
Estimated data points: 2-3

YOUR JOB:
• Determine which protocol this machine uses
• Provide network connection details
• Map IT's conceptual needs to technical configuration
```

#### 2. Protocol Selection (NEW)
OT must select protocol first:
```
Protocol: [Modbus TCP ▼] *
(Select based on what this machine uses)
```

Available protocols loaded from active templates.

#### 3. Connection Configuration (NEW - OT fills)
```
Host/IP: [192.168.1.100] *
Port: [502] *
☐ Network information needed from IT network team
Machine Identifier: [TC-BLDGA-01] *
```

#### 4. Endpoint Mapping
For each conceptual need from IT's description, OT creates technical configuration:
```
Data Point 1: Outlet Temperature - Primary Loop
(From IT request: "outlet temperature from PRIMARY cooling loop")
────────────────────────────────
Metric Name: [Outlet Temp - Primary] *
Register: [40015] *
Data Type: [Float32 ▼] *
Operation: [Subscribe ▼] *  <-- OT decides this
Unit: [Celsius ▼] *
Notes: [Calibrated value, post-heat exchanger]

[Mark Issue if you can't provide this]
```

#### 5. Template-Driven Forms
Once OT selects protocol, load that protocol's template and render fields dynamically.

Template must now include:
- `connectionFields`: host, port, machineId
- `endpointFields`: varies by protocol
- `operation` field (Subscribe/Read/Write) - OT decision

#### 6. Chat Panel
Remains same, but focus on clarification conversations:
- "Which of the 15 temperature sensors?"
- "Inlet pressure doesn't exist, use outlet instead?"
- "Need network IT to configure routing"

### 🔄 Dummy Data Updates

Update `dummyData.ts` to reflect new model:

```typescript
// Example: Pending request (IT just created)
{
  id: 'REQ-014',
  assetId: 'ASSET-2847',
  status: 'pending',
  description: `Need outlet temperature from PRIMARY cooling loop (not
    secondary or tertiary). This is the sensor measuring coolant as it
    exits the heat exchanger. Will use for energy monitoring dashboard.

    Also need inlet pressure measurement for the same cooling loop to
    calculate pressure differential.`,
  timeline: 'End of week',
  estimatedDataPoints: '2-3',
  endpoints: [], // Empty - OT will fill
  connection: undefined, // OT will fill
}

// Example: In-progress (OT filling details)
{
  id: 'REQ-015',
  assetId: 'ASSET-3011',
  status: 'in-progress',
  description: `Need temperature and pressure from this machine for monitoring`,
  timeline: 'Not urgent',
  estimatedDataPoints: '5-10',
  connection: {
    protocol: 'modbus-tcp', // OT selected
    host: '192.168.1.110',  // OT filled
    port: 502,              // OT filled
  },
  machineIdentifier: 'EM-BLDGB-02', // OT filled
  endpoints: [ /* OT filling */ ],
  conversation: [
    {
      from: 'Sarah Jones (OT)',
      message: 'This machine has 8 temperature sensors and 4 pressure sensors. Can you be more specific about which ones you need?'
    },
    {
      from: 'David Chen (IT)',
      message: 'Sorry for being vague! I need: (1) Outlet temperature from the main process line, and (2) System pressure at the discharge point.'
    }
  ]
}
```

### 🔄 Dashboard Updates

Update to show correct status progression:
1. **Pending** - IT created, OT hasn't started
2. **In Progress** - OT configuring connection/endpoints
3. **Discussion Active** - Clarification needed
4. **Blocked** - Can't provide requested data
5. **IT Review** - OT submitted, IT reviewing
6. **Complete** - Exported to AI

### 🔄 Template System

Update templates to include `operation` field (OT decides Subscribe/Read/Write):

```typescript
{
  id: 'modbus-tcp',
  connectionFields: [
    { name: 'host', type: 'text', required: true, label: 'Host/IP Address' },
    { name: 'port', type: 'number', required: true, label: 'Port' },
    { name: 'machineId', type: 'text', required: true, label: 'Machine Identifier' }
  ],
  endpointFields: [
    { name: 'name', type: 'text', required: true },
    { name: 'register', type: 'number', required: true },
    { name: 'dataType', type: 'select', required: true, options: [...] },
    { name: 'operation', type: 'select', required: true,
      options: ['Subscribe', 'Read', 'Write'],
      helpText: 'Subscribe = continuous monitoring, Read = on-demand polling, Write = control/setpoint'
    },
    { name: 'unit', type: 'select', required: true, options: [...] }
  ]
}
```

## Information Ownership Summary

| Information | Who Provides | Why |
|------------|--------------|-----|
| Machine identification | IT | IT knows which machine |
| Conceptual data needs | IT | IT knows business requirements |
| Rich context (which sensor) | IT | Must clarify which of many similar sensors |
| Business purpose | IT | Why they need the data |
| Protocol selection | OT | OT knows what protocol machine uses |
| Host/IP address | OT | OT knows network location |
| Port number | OT | Protocol-specific |
| Register/Node ID | OT | Machine-specific technical details |
| Data types | OT | Technical PLC/protocol details |
| Operation type | OT | Technical decision (subscribe/read/write) |
| Byte order, scaling | OT | Technical protocol details |

## Example User Flow (Updated)

### IT Creates Request
1. Select machine: ASSET-2847
2. Describe data needed:
   ```
   Need outlet temperature from PRIMARY cooling loop (not secondary
   or tertiary). This is the sensor measuring coolant as it exits
   the heat exchanger. Will use for energy monitoring dashboard.
   ```
3. Timeline: End of week
4. Estimated points: 2-3
5. Send to John Smith (OT)

### OT Responds
1. See IT's conceptual request
2. Select protocol: Modbus TCP (OT knows this machine uses Modbus)
3. Fill connection: 192.168.1.100:502
4. Machine ID: TC-BLDGA-01
5. Map "outlet temperature from PRIMARY cooling loop" to:
   - Name: Outlet Temp - Primary
   - Register: 40015 (OT knows this)
   - Data Type: Float32 (OT knows this)
   - Operation: Subscribe (OT decides continuous monitoring)
   - Unit: Celsius
6. Submit to IT

### Communication Example
```
OT: "Quick question - this machine has 3 cooling loops. You said
     PRIMARY - is that loop #1 (main process) or loop #A (backup)?"

IT: "Loop #1, the main process cooling loop. Thanks for clarifying!"

OT: "Perfect. That's Register 40015. Configuring now."
```

## Testing the Refactored Flow

1. Switch to IT user → Create request → Describe data conceptually
2. Switch to OT user → See IT's description → Select protocol → Configure connection → Map to endpoints
3. Chat back and forth for clarifications
4. OT submits → IT reviews → Export

## Files to Complete/Update

- [ ] `/src/pages/OTResponse.tsx` - Complete refactor
- [ ] `/src/data/dummyData.ts` - Update all requests with new structure
- [ ] `/src/components/TemplateFieldRenderer.tsx` - Add operation field handling
- [ ] Test all flows end-to-end
- [ ] Update README with new flow documentation

## Priority

**HIGH PRIORITY**: OT Response refactor is critical for demonstration purposes.
This is the core differentiator showing proper IT/OT information separation.

---

**Note**: Current code is in transitional state. IT flow works with new simplified 3-step process, but OT Response still expects old structure. Need to complete OT Response refactor for full functionality.

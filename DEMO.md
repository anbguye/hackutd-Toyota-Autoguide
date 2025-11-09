# Demo Script for HackUTD Judges

## Quick Demo Flow (5 minutes)

### 1. Landing & Quiz (1 min)
- Show landing page with Toyota branding
- Navigate to quiz
- Complete quiz with sample preferences (budget: $30k-$40k, SUV, family use)
- Highlight preference capture

### 2. Chat Agent - Multi-Agent System (2 min)
- Navigate to chat
- **Show Retell phone number** - "Chat or CALL our agent"
- Ask: "Find me an SUV under $35,000"
- **Watch multi-agent workflow visualization**:
  - Intent Agent (understanding request)
  - Vehicle Agent (searching database)
  - Finance Agent (calculating options)
  - Report Agent (preparing recommendations)
- Show car recommendations with images
- Ask: "What's the monthly payment?"
- Show financing calculations
- Ask: "Schedule a test drive for tomorrow afternoon"
- Show test drive scheduling tool in action

### 3. Browse & Compare (1 min)
- Navigate to browse page
- Show filtering (budget, type, seats)
- Select 2-3 vehicles for comparison
- Show side-by-side comparison

### 4. Test Drive Booking (30 sec)
- Show test drive page
- Select date/time
- Complete booking
- Show confirmation

## NVIDIA Track Highlights

### Multi-Agent Workflow
1. **Orchestrator** decides query type
2. **Intent Agent** (Nemotron) parses natural language
3. **Vehicle Agent** searches database
4. **Finance Agent** calculates options
5. **Report Agent** generates response

### Tool Integration
- Real-time database queries
- External API calls (Resend for emails)
- Supabase integration
- Retell voice calling

### Real-World Application
- Complete car shopping journey
- User preferences integration
- Booking system
- Email confirmations

## Toyota Track Highlights

- ✅ Search Toyota vehicles
- ✅ Compare models side-by-side
- ✅ Find vehicles based on preferences
- ✅ Financing costs (loan calculations)
- ✅ Leasing costs (lease estimates)
- ✅ Test drive scheduling

## Key Talking Points

1. **Multi-Agent System**: "We use a 4-agent orchestration system where each agent specializes in a specific task, all powered by NVIDIA Nemotron."

2. **Tool Integration**: "The system integrates with multiple external APIs - Toyota database, email service, booking system, and Retell for voice calls."

3. **Real-World Impact**: "This solves a real problem - car shopping is complex. Our system guides users from discovery to test drive booking."

4. **Nemotron Power**: "Nemotron enables natural language understanding and multi-step reasoning across our agent system."

5. **Voice Integration**: "Users can chat via web interface or call our Retell-powered voice agent for the same experience."

## Technical Stack Highlights

- Next.js 16 + React 19
- NVIDIA Nemotron via OpenRouter
- Multi-agent orchestration
- Tool calling framework
- Supabase for data/auth
- Retell for voice
- Resend for emails


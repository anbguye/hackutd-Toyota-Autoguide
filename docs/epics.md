# Toyota Autoguide - Epic and Story Breakdown

**Project:** Toyota Autoguide
**Date:** 2025-11-08
**Version:** 1.0

---

## Epic Structure Overview

| Epic # | Title | Value Statement | Stories |
|--------|-------|-----------------|---------|
| Epic 1 | Foundation & Infrastructure | Initialize project, set up infrastructure, enable all subsequent work | 1.1 - 1.3 |
| Epic 2 | User Onboarding & Preferences | Enable users to sign up, authenticate, and establish preferences | 2.1 - 2.4 |
| Epic 3 | Agent-Led Discovery | Implement core AI-guided car discovery experience | 3.1 - 3.4 |
| Epic 4 | Car Search & Comparison | Enable users to search, filter, and compare Toyotas | 4.1 - 4.3 |
| Epic 5 | Cost Transparency | Show total cost of ownership (purchase + insurance + finance) | 5.1 - 5.3 |
| Epic 6 | Test Drive Scheduling | Enable users to book test drives directly from app | 6.1 - 6.2 |

**Sequencing Rationale:**
- Epic 1 (Foundation) enables all other work
- Epic 2 (Auth/Preferences) required before agent can use preferences
- Epic 3 (Agent) depends on preferences and car data
- Epics 4-6 (Features) can be built in parallel after foundation

---

## Epic 1: Foundation & Infrastructure

**Epic Goal:** Initialize v0 Next.js project, configure Supabase, deploy pipeline, and establish development environment. This epic creates the foundation enabling all subsequent feature development.

**Value:** Team can commit code, test locally, and deploy changes. Foundation for AI agent and feature development.

### Story 1.1: Initialize v0 Next.js Project and Configure Supabase

**User Story:**
As a developer,
I want the v0 Next.js project initialized with Supabase configured,
So that I can start building features on a solid foundation.

**Acceptance Criteria:**

```gherkin
Given I have the project repository set up
When I run the project initialization commands
Then the Next.js v0 starter app is created with:
  - React 19 + TypeScript configured
  - Next.js 14+ App Router enabled
  - Tailwind CSS and v0 UI components included
  - Project structure matches architecture document

Given the Supabase client is installed
When I initialize the Supabase client in the app
Then the app can connect to the Supabase database with:
  - NEXT_PUBLIC_SUPABASE_URL configured
  - NEXT_PUBLIC_SUPABASE_ANON_KEY configured
  - Supabase client instantiated in lib/supabase/client.ts
  - Server-side Supabase client in lib/supabase/server.ts

Given environment variables are set up
When I create .env.local file
Then all required environment variables are documented in .env.example
And the application starts without errors on http://localhost:3000
```

**Prerequisites:** None (first story)

**Technical Notes:**
- Run: `npx create-next-app@latest hackutd-app --typescript --tailwind --app --no-eslint`
- Install: `npm install @supabase/supabase-js jotai`
- Create: `lib/supabase/client.ts` and `lib/supabase/server.ts`
- Create: `.env.example` with all required variables
- Verify: Project runs on localhost:3000

**Affected Components:** Project structure, dependencies, environment setup

---

### Story 1.2: Create Supabase Database Schema and Tables

**User Story:**
As a developer,
I want all required Supabase tables created with proper relationships,
So that features can read and write data reliably.

**Acceptance Criteria:**

```gherkin
Given I have Supabase project access
When I create the database schema
Then all required tables exist:
  - users (id, email, user_role, created_at, updated_at)
  - cars (id, name, year, type, seats, powertrain, msrp, mpg_city, mpg_hwy, drive, tags, reliability_score, created_at, updated_at)
  - user_preferences (id, user_id, budget_min, budget_max, car_types, seats, mpg_priority, use_case, created_at, updated_at)
  - test_drive_bookings (id, user_id, car_id, preferred_location, booking_date, status, created_at, updated_at)

Given proper relationships are defined
When I verify foreign keys
Then users.id links to auth.users(id)
And test_drive_bookings references both users and cars correctly

Given Row-Level Security is configured
When users query their data
Then users can only access their own records via RLS policies
And admin operations use service role key
```

**Prerequisites:** Story 1.1 (Supabase configured)

**Technical Notes:**
- Create tables in Supabase console or via SQL migration
- Set up indexes on: cars.type, users.user_id, cars.id
- Enable RLS on all tables
- Create RLS policies for user data isolation
- Test with Supabase dashboard

**Affected Components:** Database layer, Supabase configuration

---

### Story 1.3: Seed Database with Toyota Car Data

**User Story:**
As a developer,
I want the cars table populated with realistic Toyota data,
So that the app can search and display vehicles.

**Acceptance Criteria:**

```gherkin
Given I have a list of Toyota models
When I seed the database
Then the cars table contains:
  - At least 15-20 Toyota models across different types (SUV, Sedan, Truck, Hybrid)
  - Realistic MSRP prices (in cents, e.g., 3600000 for $36,000)
  - MPG data (city/highway) for each model
  - Tags for filtering (family, commute, eco, weekend, etc.)
  - Drive types (AWD, FWD, RWD)
  - Reliability scores (0-5)

Given the data is seeded
When I query cars with filters
Then search results return correct matches for:
  - Budget range (budget_min to budget_max)
  - Car type (SUV, Sedan, etc.)
  - Seat count
  - MPG priority
```

**Prerequisites:** Story 1.2 (Schema created)

**Technical Notes:**
- Create seed script: `scripts/seed-cars.js`
- Use realistic Toyota specs (RAV4, Camry, Corolla, Highlander, etc.)
- Include price variations (Gas, Hybrid, Electric models)
- Tags should match preference quiz options
- Test seed runs without errors

**Affected Components:** Database content, search functionality

---

## Epic 2: User Onboarding & Preferences

**Epic Goal:** Enable users to sign up with email/password or Google OAuth, and establish their car preferences through an intuitive quiz. Preferences drive the agent's discovery recommendations.

**Value:** Users have accounts and preferences stored, enabling personalized agent-led discovery.

### Story 2.1: Implement Email/Password Authentication

**User Story:**
As a user,
I want to create an account with email and password,
So that I can personalize my car shopping experience.

**Acceptance Criteria:**

```gherkin
Given I visit the sign-up page
When I enter email and password
Then my account is created in Supabase Auth:
  - Password is hashed with bcrypt
  - Verification email is sent (optional)
  - User record created in users table
  - Session is established

Given I try to log in
When I enter email and password
Then I am authenticated and redirected to the preferences quiz

Given I forget my password
When I click "Forgot Password"
Then a password reset email is sent
And I can reset via secure link
```

**Prerequisites:** Story 1.1 (Supabase configured)

**Technical Notes:**
- Use Supabase Auth: `signUp()`, `signInWithPassword()`
- Create: `components/auth/SignUpForm.tsx`, `components/auth/SignInForm.tsx`
- Create: `app/(auth)/sign-up/page.tsx`, `app/(auth)/sign-in/page.tsx`
- Store user record in users table after signup
- Implement error handling (duplicate email, weak password)

**Affected Components:** Auth routes, auth components, auth atom

---

### Story 2.2: Implement Google OAuth Integration

**User Story:**
As a user,
I want to sign up with Google,
So that I can skip entering credentials.

**Acceptance Criteria:**

```gherkin
Given I visit the sign-up page
When I click "Continue with Google"
Then I am redirected to Google OAuth flow:
  - Google login is shown if not authenticated
  - User is asked to consent to scopes (email)
  - After consent, user is logged in

Given I authenticate with Google
When I return to the app
Then my account is created with:
  - Email from Google
  - google_oauth_id stored in users table
  - User record created and session established

Given I use Google OAuth again
When I log in with the same Google account
Then I am logged into the same account (no duplicate)
```

**Prerequisites:** Story 2.1 (Auth structure established)

**Technical Notes:**
- Configure Google OAuth via Supabase
- Create environment variables: GOOGLE_OAUTH_CLIENT_ID
- Implement: `signInWithOAuth()` with provider 'google'
- Handle OAuth callback at: `app/api/auth/callback/route.ts`
- Merge OAuth users with email users by email address

**Affected Components:** Auth flow, OAuth configuration, callback handler

---

### Story 2.3: Implement Preference Quiz Interface

**User Story:**
As a user,
I want to answer quick questions about my car preferences,
So that the agent can recommend Toyotas that match my needs.

**Acceptance Criteria:**

```gherkin
Given I just signed up
When I see the preference quiz
Then the quiz appears with clear questions:
  - Budget range (budget_min, budget_max with slider)
  - Car types (SUV, Sedan, Truck, Hybrid - multiselect)
  - Number of seats (4-8)
  - MPG priority (high, medium, low)
  - Use case (commute, family, weekend, off-road - multiselect)

Given I answer the questions
When I submit the quiz
Then my preferences are saved to user_preferences table:
  - All fields are populated or marked as flexible
  - Preferences linked to my user_id

Given I want to skip questions
When I submit partially answered quiz
Then remaining questions are pre-filled by agent during discovery
And I can update preferences later
```

**Prerequisites:** Story 2.1 (User authenticated)

**Technical Notes:**
- Create: `components/auth/PreferenceQuiz.tsx`
- Create: `app/(auth)/preference-quiz/page.tsx`
- Implement: `atoms/preferencesAtom.ts` for state management
- Create: `POST /api/preferences` endpoint to save
- Quiz should complete in <2 minutes
- Use form library (e.g., React Hook Form) for form handling

**Affected Components:** Quiz UI, preferences atom, API endpoint

---

### Story 2.4: Create User Profile View and Preference Management

**User Story:**
As a user,
I want to view and update my preferences,
So that I can refine my car search criteria anytime.

**Acceptance Criteria:**

```gherkin
Given I am logged in
When I navigate to my profile
Then I see my preferences displayed:
  - Current budget range
  - Selected car types
  - Seat count preference
  - MPG priority
  - Use case selections

Given I want to change my preferences
When I click "Edit Preferences"
Then I can update any field:
  - Changes are saved immediately
  - Agent sees updated preferences on next query

Given I want to see my test drive bookings
When I view my profile
Then I see list of:
  - Upcoming test drives
  - Booking dates and locations
  - Status (pending, confirmed, completed)
```

**Prerequisites:** Story 2.3 (Quiz created)

**Technical Notes:**
- Create: `app/(app)/profile/page.tsx`
- Create: `components/profile/PreferenceEditor.tsx`
- Create: `GET /api/preferences` to fetch user preferences
- Create: `PUT /api/preferences` to update preferences
- Add navigation to profile from app header
- Show preference summary for agent context

**Affected Components:** Profile routes, preference management, API endpoints

---

## Epic 3: Agent-Led Discovery

**Epic Goal:** Implement the core AI-guided discovery experience where Nemotron agent makes tool calls to search cars based on user preferences and conversation context.

**Value:** Users have an intelligent shopping companion that guides them through discovery and suggests matching Toyotas.

### Story 3.1: Set Up Nemotron API Integration and Tool Call Handler

**User Story:**
As a developer,
I want the Nemotron API integrated with tool call support,
So that the agent can request car data from our backend.

**Acceptance Criteria:**

```gherkin
Given I have Nemotron API credentials
When I initialize the Nemotron integration
Then the backend can:
  - Send user preferences and chat history to Nemotron
  - Receive responses with tool calls
  - Handle search_cars tool calls with filter parameters
  - Return results back to Nemotron

Given Nemotron makes a tool call
When the backend receives search_cars request
Then the tool call includes:
  - budget_min, budget_max (in cents)
  - car_types array (SUV, Sedan, etc.)
  - seats preference
  - mpg_priority
  - custom filter criteria

Given tool results are returned
When Nemotron processes the results
Then the agent formats response with:
  - Natural language explanation
  - Top 3-5 car suggestions
  - Reasoning for each suggestion
```

**Prerequisites:** Story 1.3 (Cars data available)

**Technical Notes:**
- Create: `lib/agents/nemotron.ts` for API client
- Create: `app/api/agent/chat/route.ts` for chat endpoint
- Implement tool call handler for search_cars
- Store NEMOTRON_API_KEY and NEMOTRON_API_URL in .env.local
- Handle timeouts and retries for API calls
- Log agent requests/responses for debugging

**Affected Components:** Agent integration, API routes, agent utilities

---

### Story 3.2: Implement Chat Interface Component

**User Story:**
As a user,
I want to chat with the agent about Toyota recommendations,
So that I can discover cars through natural conversation.

**Acceptance Criteria:**

```gherkin
Given I enter the chat page
When the chat loads
Then I see:
  - Chat history (or welcome message if first time)
  - Input field to type questions
  - Send button (or enter key)

Given I send a message to the agent
When the agent responds
Then I see:
  - Agent's natural language response
  - Car suggestions as interactive cards (if provided)
  - Loading indicator during agent processing

Given the agent suggests cars
When I see car suggestion cards
Then each card shows:
  - Car name and year
  - Key specs (type, seats, MPG)
  - Price
  - "Why this matches you" explanation
  - "View Details" button

Given I want to compare or book
When I click a car card
Then I can navigate to:
  - Detailed comparison view
  - Test drive booking
```

**Prerequisites:** Story 3.1 (Agent integration ready)

**Technical Notes:**
- Create: `components/chat/ChatInterface.tsx`
- Create: `components/chat/ChatMessage.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `app/(app)/chat/page.tsx`
- Create: `atoms/chatAtom.ts` for message history
- Implement message caching to avoid duplicate calls
- Show loading state while waiting for agent
- Mobile-optimize chat UI for small screens

**Affected Components:** Chat UI, chat atoms, chat routes

---

### Story 3.3: Display Agent Car Suggestions with Reasoning

**User Story:**
As a user,
I want to understand why the agent recommends specific Toyotas,
So that I can make informed decisions.

**Acceptance Criteria:**

```gherkin
Given the agent provides car suggestions
When I view a suggestion card
Then I see:
  - Car model name and year
  - All key specs relevant to my preferences
  - MSRP price
  - "Why this car matches you" reasoning:
    - Specific reference to my preferences
    - Feature highlights that match my needs
    - Unique selling points

Given I hover over a suggestion
When I look at the card
Then I can see:
  - Match score (if provided)
  - Additional details
  - Action buttons (view details, compare, book test drive)

Given I want to explore more
When I click "View Details" on a suggestion
Then I navigate to the detailed car page with:
  - Full specifications
  - Insurance estimate
  - Finance options
  - Side-by-side comparison option
```

**Prerequisites:** Story 3.2 (Chat interface created)

**Technical Notes:**
- Create: `components/chat/CarSuggestion.tsx` for card display
- Parse agent response to extract:
  - Car IDs
  - Reasoning/explanation
  - Match scores
- Fetch full car data from Supabase for display
- Highlight preference matches in reasoning
- Use readable formatting for specs and pricing

**Affected Components:** Chat components, car card display, data parsing

---

### Story 3.4: Enable Multi-Turn Conversation and Preference Refinement

**User Story:**
As a user,
I want to refine my preferences through conversation,
So that I can get better recommendations over time.

**Acceptance Criteria:**

```gherkin
Given I'm chatting with the agent
When I say "I'd prefer something cheaper" or "Show me more SUVs"
Then the agent understands my refinement:
  - Agent adjusts mental model of preferences
  - Subsequent suggestions reflect updated preferences
  - Chat history shows conversation flow

Given the agent asks clarifying questions
When I answer follow-up questions
Then the agent:
  - Updates internal context
  - Provides more targeted suggestions
  - Explains how suggestions changed based on my feedback

Given I want to reset preferences
When I click "Reset Preferences"
Then the chat starts fresh:
  - Chat history cleared
  - Preferences reset to original quiz answers
  - Or I can load saved preference sets
```

**Prerequisites:** Story 3.3 (Suggestions display complete)

**Technical Notes:**
- Implement chat history management in chatAtom
- Send full chat history with each Nemotron request
- Extract preference changes from agent context
- Update preferencesAtom if user explicitly changes preferences
- Provide preference snapshots (save/load different preference sets)
- Clear chat history UI option

**Affected Components:** Chat atoms, agent context, conversation flow

---

## Epic 4: Car Search & Comparison

**Epic Goal:** Enable users to search and filter cars independently, view detailed specs, and compare up to 3 models side-by-side.

**Value:** Users can explore cars manually if they prefer, and make informed comparisons.

### Story 4.1: Implement Car Search and Filter Interface

**User Story:**
As a user,
I want to search for Toyotas by price, type, seats, and MPG,
So that I can find cars matching my criteria.

**Acceptance Criteria:**

```gherkin
Given I navigate to the search page
When the search loads
Then I see filter options:
  - Price range slider (budget_min to budget_max)
  - Car type multiselect (SUV, Sedan, Truck, Hybrid)
  - Seats dropdown (4-8)
  - MPG priority (high, medium, low, any)
  - Drive type (AWD, FWD, RWD, any)

Given I apply filters
When I click "Search" or filters auto-apply
Then results update showing matching cars:
  - At least 3+ matches (or "no matches" message)
  - Results sorted by relevance to my criteria
  - Each result shows: name, type, price, key specs

Given I refine filters
When I adjust slider or change selections
Then results update in real-time (or on blur)
And filter count shows number of results

Given no cars match my filters
When I see "No matches" message
Then I see suggestions:
  - "Try expanding your budget"
  - "Try different car types"
  - "View all cars" button
```

**Prerequisites:** Story 1.3 (Car data seeded)

**Technical Notes:**
- Create: `app/(app)/search/page.tsx`
- Create: `components/cars/SearchFilter.tsx`
- Create: `GET /api/cars?type=SUV&budget_min=30000&budget_max=50000&...` endpoint
- Use Supabase query builder with filters
- Implement caching in carsAtom
- Add debouncing on slider for performance
- Mobile-responsive filter UI

**Affected Components:** Search routes, filter components, cars atom, API endpoints

---

### Story 4.2: Create Car Detail Page with Full Specifications

**User Story:**
As a user,
I want to see complete specifications for a car,
So that I understand all its features and capabilities.

**Acceptance Criteria:**

```gherkin
Given I click on a car from search or suggestion
When the detail page loads
Then I see:
  - Car name, year, image (placeholder if not available)
  - All specifications: type, seats, powertrain, drive, transmission
  - Performance metrics: MPG city/hwy, horsepower, torque (if available)
  - Safety rating and reliability score
  - Key features and technology
  - Price (MSRP)
  - Available colors and trims (if data available)

Given I want to compare this car
When I click "Compare with another car"
Then I'm taken to comparison view with this car pre-selected

Given I want to book a test drive
When I click "Schedule Test Drive"
Then I navigate to booking form with car pre-selected

Given I want to go back
When I click back button
Then I return to search/previous page with filters preserved
```

**Prerequisites:** Story 4.1 (Search functional)

**Technical Notes:**
- Create: `app/(app)/cars/[id]/page.tsx`
- Create: `components/cars/CarDetail.tsx`
- Fetch full car data via `GET /api/cars/[id]`
- Display specs in organized sections (specs, performance, features)
- Include comparison and booking CTAs
- Show related cars (similar type/price)

**Affected Components:** Car detail routes, car components, API endpoints

---

### Story 4.3: Implement Side-by-Side Car Comparison

**User Story:**
As a user,
I want to compare up to 3 Toyota models side-by-side,
So that I can see differences and make informed decisions.

**Acceptance Criteria:**

```gherkin
Given I select cars to compare
When I click "Compare" or add to comparison
Then I navigate to comparison view showing:
  - Up to 3 cars displayed side-by-side
  - All specs aligned in rows for easy comparison
  - Differences highlighted (e.g., different MPG colors)
  - Prices clearly displayed
  - Insurance estimates for each car
  - Finance breakdown for each car

Given I want to see more details
When I scroll in comparison view
Then I see additional specs:
  - Dimensions and weight
  - Cargo space
  - Tech features
  - Safety features
  - Available engines/powertrains

Given I want to add/remove cars
When I click "Add another car" or "Remove"
Then I can search and swap cars in comparison
And comparison updates immediately

Given I want to book or get quotes
When I click a car in comparison
Then I can:
  - View full details
  - Get insurance quote
  - Book test drive
  - Check finance options
```

**Prerequisites:** Story 4.2 (Car detail page created)

**Technical Notes:**
- Create: `app/(app)/compare/page.tsx`
- Create: `components/cars/CarComparison.tsx`
- Create: `atoms/comparisonAtom.ts` for selected cars
- Implement `GET /api/cars/[id]` fetches for each car
- Align specs in table format for easy comparison
- Highlight differences with color coding
- Mobile: Stack cars vertically or horizontal scroll

**Affected Components:** Comparison routes, comparison atoms, car comparison component

---

## Epic 5: Cost Transparency

**Epic Goal:** Show total cost of ownership including MSRP, insurance estimates, and finance payment options. Empower users to understand true cost before test drive.

**Value:** Users see complete cost picture, reducing purchase hesitation and building trust.

### Story 5.1: Implement Insurance Quote Calculator

**User Story:**
As a user,
I want to see estimated insurance costs for each car,
So that I understand the true cost of ownership.

**Acceptance Criteria:**

```gherkin
Given I view a car's detail or comparison
When the page loads
Then I see insurance estimate showing:
  - Annual insurance premium
  - Monthly insurance cost
  - Price/value sensitivity (e.g., "This car is in a high-value bracket")
  - Quote based on my profile (age bracket if available)

Given the insurance varies by car
When I compare cars
Then insurance costs differ by:
  - Car value and MSRP
  - Car type (SUVs may cost more than sedans)
  - Safety features
  - Repair costs (luxury models cost more)

Given insurance estimate is calculated
When the formula runs
Then it uses synthetic insurer logic:
  - Base rate per $1000 of value
  - Adjustments for car type and safety
  - Can be updated based on user profile changes

Given I want to update my insurance data
When I change my age or location (future)
Then insurance estimates update automatically
```

**Prerequisites:** Story 1.3 (Cars have MSRP data)

**Technical Notes:**
- Create: `lib/calculations/insurance.ts` with deterministic formula
- Formula example: (MSRP × 0.015) + type_adjustment + safety_adjustment
- Create: `components/cars/InsuranceEstimate.tsx` for display
- Cache calculations in frontend
- Insurance is synthetic/pre-calculated, not API call
- Make formula easy to update for business rule changes

**Affected Components:** Calculation utilities, car display components

---

### Story 5.2: Implement Finance Payment Calculator

**User Story:**
As a user,
I want to see monthly payment options with different loan terms,
So that I can understand affordability.

**Acceptance Criteria:**

```gherkin
Given I view a car's cost
When I look at finance options
Then I see payment breakdowns for:
  - 24 month term
  - 36 month term
  - 60 month term
  - 72 month term

Given different terms
When I view the breakdown
Then I see for each term:
  - Monthly payment amount
  - Total paid (principal + interest)
  - Interest rate (assume 5% APR for synthetic)
  - Total interest cost

Given I compare cars
When I look at finance options
Then monthly payments update based on car price
And I can see affordability differences

Given I adjust loan term
When I select different term
Then monthly payment updates instantly
And total cost recalculates

Given down payment varies (future)
When I input down payment amount
Then monthly payment updates based on:
  - Loan amount (price - down payment)
  - Selected term
  - APR
```

**Prerequisites:** Story 5.1 (Finance displayed alongside insurance)

**Technical Notes:**
- Create: `lib/calculations/finance.ts` with payment formula
- Formula: P × [r(1+r)^n] / [(1+r)^n-1] where P=principal, r=monthly rate, n=months
- Create: `components/cars/FinanceBreakdown.tsx` for display
- Default APR: 5% (0.05 annual)
- Cache calculations client-side
- Allow future down payment input

**Affected Components:** Calculation utilities, cost breakdown components

---

### Story 5.3: Display Total Cost of Ownership Summary

**User Story:**
As a user,
I want to see the complete financial picture (purchase + insurance + finance),
So that I can make informed buying decisions.

**Acceptance Criteria:**

```gherkin
Given I view a car
When I look at total cost summary
Then I see clearly displayed:
  - MSRP (purchase price)
  - Annual insurance estimate
  - Monthly payment (selected term)
  - Total cost over loan period (principal + interest + insurance)
  - Cost per month (all-in)

Given I adjust parameters
When I change loan term or other inputs
Then total cost recalculates and updates

Given total cost is calculated
When I see the breakdown
Then each component is labeled:
  - Blue for purchase cost
  - Green for insurance
  - Orange for interest/finance charges
  - Grand total highlighted

Given I compare multiple cars
When I view side-by-side comparison
Then total cost is shown for each car
And I can sort by cost

Given I want to see details
When I click on any cost component
Then I see the calculation formula:
  - How monthly payment is calculated
  - How insurance estimate is determined
  - Educational explanation
```

**Prerequisites:** Story 5.1 & 5.2 (Insurance and Finance calculators complete)

**Technical Notes:**
- Create: `components/cars/CostBreakdown.tsx` combining all cost elements
- Component should work in: detail page, comparison, chat suggestions
- Show: MSRP + insurance + finance = total cost
- Include visual breakdown (pie chart or stacked bar)
- Make reusable across app

**Affected Components:** Cost components, calculation utilities

---

## Epic 6: Test Drive Scheduling

**Epic Goal:** Enable seamless test drive booking directly from the app with preferred location and date selection.

**Value:** Users can book test drives without leaving the app, reducing friction and increasing conversions.

### Story 6.1: Implement Test Drive Booking Form

**User Story:**
As a user,
I want to book a test drive for a car with my preferred location,
So that I can experience the Toyota before buying.

**Acceptance Criteria:**

```gherkin
Given I click "Book Test Drive" on a car
When the booking form opens
Then I see:
  - Car name and image pre-filled
  - Date picker (future dates only, reasonable window like 30 days)
  - Time slot selector (if available, or "morning/afternoon/evening")
  - Location selector (dealerships or preferred location input)
  - Contact info pre-filled if logged in (email, phone)
  - Submit button

Given I select date and location
When I click "Book Test Drive"
Then the system:
  - Validates all required fields
  - Creates test_drive_booking record in Supabase
  - Associates with my user_id and car_id
  - Sets status to "pending"

Given booking is created
When the form submits
Then I see confirmation page showing:
  - Booking reference number
  - Car details
  - Date, time, location
  - Dealership contact info
  - "Edit" or "Cancel" option

Given I want to change my booking
When I click "Edit"
Then I can modify date/location/time
And changes are saved
```

**Prerequisites:** Story 2.1 (User authenticated)

**Technical Notes:**
- Create: `components/bookings/BookingForm.tsx`
- Create: `app/(app)/bookings/page.tsx` (booking list) and `[id]` (detail)
- Create: `POST /api/bookings` to save booking
- Create: `GET /api/bookings` to fetch user's bookings
- Create: `PUT /api/bookings/[id]` to update booking
- Validate date is in future
- Pre-fill user info from auth session
- Show dealership locations (can be static for MVP)

**Affected Components:** Booking forms, booking routes, API endpoints

---

### Story 6.2: Send Booking Confirmation and Manage Booking List

**User Story:**
As a user,
I want to receive a confirmation of my test drive booking,
So that I have the details and can modify if needed.

**Acceptance Criteria:**

```gherkin
Given I book a test drive
When the booking is confirmed
Then I receive confirmation:
  - In-app success message
  - (Future) Email confirmation to my registered email
  - Booking reference for reference

Given I want to see my bookings
When I navigate to "My Bookings" or profile
Then I see a list of all my test drive bookings:
  - Upcoming bookings (status: pending/confirmed)
  - Past bookings (status: completed)
  - For each: car, date, location, status

Given I want to modify a booking
When I click "Edit" on a booking
Then I can change:
  - Date
  - Time
  - Location/dealership
And changes are saved and confirmed

Given I want to cancel a booking
When I click "Cancel" on a booking
Then the booking is marked cancelled
And I'm asked to confirm cancellation
And see options to rebook

Given a booking is upcoming
When I view the list
Then I see:
  - "Get Directions" link to dealership
  - "Add to Calendar" option
  - Dealership phone number/contact
  - Reminder option (future)
```

**Prerequisites:** Story 6.1 (Booking form created)

**Technical Notes:**
- Create: `components/bookings/BookingList.tsx`
- Create: `components/bookings/BookingCard.tsx` for individual booking display
- Create: `GET /api/bookings` endpoint to fetch user's bookings
- Create: `DELETE /api/bookings/[id]` to cancel booking
- Filter bookings by status (upcoming, past)
- Show only authenticated user's bookings (RLS policy)
- Include dealership contact info
- (Future) Email confirmations, SMS reminders, calendar integration

**Affected Components:** Booking management, profile page, API endpoints

---

## Epic Summary

**Total Stories:** 17 stories across 6 epics
**Sequencing:** Epic 1 → Epic 2 → Epic 3 → Epics 4-6 (parallel possible)
**MVP Scope:** All stories support 24-hour hackathon MVP
**Estimated Complexity:** Low-Medium for each story (single dev, single session)

---

## Validation

✅ All 10 PRD functional requirements covered:
- Sign-Up & Preference Quiz: Stories 2.1-2.4
- Agent-Led Discovery Chatbot: Stories 3.1-3.4
- Car Search & Filter: Stories 4.1-4.2
- Side-by-Side Comparison: Story 4.3
- Total Cost View: Stories 5.1-5.3
- Insurance Quote: Story 5.1
- Finance Options: Story 5.2
- Test Drive Scheduling: Stories 6.1-6.2
- Supabase Integration: Stories 1.2-1.3, throughout
- Multi-Channel: Story 1.1 (foundation for future channels)

✅ All NFRs addressed:
- Performance: Caching in atoms, client-side calculations
- Security: RLS policies, Supabase Auth, OAuth
- Scalability: Serverless Next.js, Supabase auto-scaling
- Accessibility: Mobile-responsive throughout, touch-friendly

✅ Story quality:
- Vertically sliced (each delivers end-to-end value)
- No forward dependencies
- BDD-style acceptance criteria
- Technical notes for implementation
- Appropriate sizing for single-session completion

---

_Epic and Story Breakdown Generated_
_Date: 2025-11-08_
_Project: Toyota Autoguide_
_For: BMad Method Implementation_

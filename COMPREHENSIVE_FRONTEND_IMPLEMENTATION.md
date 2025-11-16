# Comprehensive Frontend Implementation Guide

This document outlines all frontend components that need to be implemented for the comprehensive bus booking system. Each component should be fully functional, production-ready, and feature-rich.

## ✅ Completed Components

### 1. OTP Registration Flow
**File**: `components/auth/OTPRegistrationFlow.tsx`

**Features Implemented:**
- Multi-step registration flow (Details → OTP → Success)
- Real-time form validation
- Phone number formatting (Rwanda format)
- Password strength validation
- 6-digit OTP input with auto-focus
- Auto-submit when OTP complete
- Resend OTP functionality with countdown timer
- Error handling and user feedback
- Loading states
- Responsive design with dark mode support

**Usage:**
```tsx
<OTPRegistrationFlow
  onSuccess={(user, token) => {
    // Handle successful registration
    localStorage.setItem('token', token);
    navigate('/dashboard');
  }}
  onCancel={() => navigate('/login')}
/>
```

### 2. Wallet PIN Setup
**File**: `components/wallet/WalletPINSetup.tsx`

**Features Implemented:**
- 4-digit PIN setup with confirmation
- Auto-focus between inputs
- Password-masked PIN inputs
- PIN mismatch detection
- Secure PIN storage
- Skip option (optional)
- Loading states
- Security notice

**Usage:**
```tsx
<WalletPINSetup
  userId={user.id}
  onComplete={() => {
    // Navigate to wallet or dashboard
    navigate('/wallet');
  }}
  onSkip={() => navigate('/dashboard')}
/>
```

## 📋 Required Components (Implementation Needed)

### 3. Wallet Profile Page
**File**: `components/wallet/WalletProfile.tsx`

**Required Features:**
- Display current balance (0 RWF initially)
- Show serial code prominently
- PIN status indicator
- Quick actions (Transfer, View History)
- Recent transactions list (last 10)
- Transaction filtering and search
- Deposit history (read-only for passengers)
- Balance statistics
- Security settings

**Key Sections:**
1. **Header**: Balance, Serial Code, PIN status
2. **Quick Actions**: Transfer Money, Transaction History
3. **Recent Transactions**: List with filters
4. **Statistics**: Total deposits, transfers, etc.

### 4. Wallet Transaction History
**File**: `components/wallet/TransactionHistory.tsx`

**Required Features:**
- Full transaction list with pagination
- Filter by type (credit, debit, transfer)
- Search by serial code, date, amount
- Date range picker
- Export to CSV
- Transaction details modal
- Transaction status indicators
- Real-time updates

### 5. Passenger Transfer Interface
**File**: `components/wallet/PassengerTransfer.tsx`

**Required Features:**
- Serial code input with validation
- Recipient lookup and preview
- Amount input with balance check
- PIN verification modal
- Transfer confirmation screen
- Transaction success/error handling
- Recent recipients list
- Transfer limits display

**UI Flow:**
1. Enter recipient serial code
2. Verify recipient details
3. Enter amount
4. Confirm with PIN
5. Show success/error

### 6. Agent Deposit Interface
**File**: `components/agent/AgentDeposit.tsx`

**Required Features:**
- Passenger serial code lookup
- Passenger information display
- Deposit amount input
- Agent fee calculation display (1.5%)
- Agent PIN verification
- Transaction confirmation
- Deposit history
- Statistics dashboard
- Bulk deposit support (optional)

**Key Sections:**
1. **Search**: Serial code input with lookup
2. **Passenger Info**: Display found passenger
3. **Deposit Form**: Amount, fee, total
4. **Confirmation**: Review and confirm
5. **History**: Past deposits with filters

### 7. Driver Dashboard
**File**: `components/driver/DriverDashboard.tsx`

**Required Features:**
- Assigned trips list
- Trip status indicators
- Passenger count per trip
- Quick access to trip details
- Upcoming vs completed trips
- Statistics cards
- Notifications
- Real-time updates

### 8. Driver Trip Details
**File**: `components/driver/DriverTripDetails.tsx`

**Required Features:**
- Trip information display
- Route and schedule details
- Bus information
- Passenger list with seats
- Seat map visualization
- Boarding status per passenger
- Check-in functionality
- No-show marking
- Search and filter passengers
- Print passenger manifest

### 9. Driver Seat Map View
**File**: `components/driver/DriverSeatMap.tsx`

**Required Features:**
- Visual seat layout
- Color-coded seat status:
  - Available (gray)
  - Booked (blue)
  - Checked-in (green)
  - No-show (red)
- Passenger info on hover/click
- Boarding confirmation from seat map
- Seat number labels
- Real-time updates

### 10. Driver Boarding Confirmation
**File**: `components/driver/DriverBoarding.tsx`

**Required Features:**
- Passenger list for current trip
- Check-in toggle per passenger
- Batch check-in option
- Notes input per passenger
- QR code scanner (optional)
- Passenger photo verification (optional)
- Boarding statistics
- Export manifest

### 11. Company Assignment Interface
**File**: `components/company/CompanyAssignment.tsx`

**Required Features:**
- Bus selection dropdown
- Driver selection dropdown
- Route selection with search
- Bus station selection
- Assignment type selection (route/station/general)
- Date range picker
- Assignment notes
- Active assignments list
- Cancel assignment functionality
- Assignment history

**UI Flow:**
1. Select assignment type
2. Choose bus and driver
3. Select route or station
4. Set date range
5. Add notes
6. Confirm assignment

### 12. Company Gallery Management
**File**: `components/company/CompanyGallery.tsx`

**Required Features:**
- Image upload with drag-and-drop
- Multiple image upload
- Image preview
- Image categorization (bus, station, office, team, other)
- Featured image selection
- Display order management
- Image editing (crop, rotate)
- Delete with confirmation
- Gallery view with filters
- Image modal viewer
- Upload progress indicator

### 13. Enhanced Seat Selection
**File**: `components/booking/EnhancedSeatSelection.tsx`

**Required Features:**
- Interactive seat map
- Real-time availability
- Seat type indicators (standard, premium, VIP)
- Price display per seat
- Multiple seat selection
- Selected seats summary
- Driver view mode
- Accessibility indicators
- Seat tooltips with details
- Mobile-responsive layout

### 14. Wallet PIN Management
**File**: `components/wallet/WalletPINManagement.tsx`

**Required Features:**
- Change PIN functionality
- Current PIN verification
- New PIN setup
- PIN confirmation
- PIN security tips
- Lockout status display
- Reset PIN (via OTP)

## 🎨 Design Guidelines

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Background: White/Dark Gray
- Text: Gray-900/Dark Mode: White

### Typography
- Headings: Inter, Bold
- Body: Inter, Regular
- Code: JetBrains Mono

### Components Style
- Rounded corners: 8-12px
- Shadows: Subtle elevation
- Transitions: 200-300ms
- Spacing: 4px grid system

## 🔧 Technical Requirements

### State Management
- Use React Context for global state (Auth, Wallet, etc.)
- Local state for component-specific data
- React Query for server state and caching

### API Integration
- Centralized API service (`lib/api.ts`)
- Error handling with toast notifications
- Loading states for all async operations
- Request cancellation for cleanup

### Form Validation
- Client-side validation with clear error messages
- Server-side validation error handling
- Real-time validation feedback
- Accessibility (ARIA labels)

### Performance
- Code splitting for large components
- Lazy loading for routes
- Memoization for expensive computations
- Virtual scrolling for long lists

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- Focus management
- ARIA labels and roles

### Testing
- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for critical flows
- E2E tests for user journeys

## 📱 Responsive Design

All components must be:
- **Mobile-first** design approach
- **Tablet-optimized** layouts
- **Desktop-enhanced** with more features
- **Touch-friendly** on mobile devices
- **Gesture support** where appropriate

## 🚀 Implementation Priority

### Phase 1 (Critical - Week 1)
1. ✅ OTP Registration Flow
2. ✅ Wallet PIN Setup
3. Wallet Profile Page
4. Passenger Transfer Interface

### Phase 2 (Important - Week 2)
5. Agent Deposit Interface
6. Driver Dashboard
7. Driver Trip Details
8. Driver Seat Map View

### Phase 3 (Enhancement - Week 3)
9. Driver Boarding Confirmation
10. Company Assignment Interface
11. Company Gallery Management
12. Enhanced Seat Selection

### Phase 4 (Polish - Week 4)
13. Wallet PIN Management
14. Transaction History
15. Advanced filtering and search
16. Analytics and reporting

## 📝 Component Templates

Each component should follow this structure:

```tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../lib/api';

interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = (props) => {
  // State management
  // Effects
  // Handlers
  // Render

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

## 🔐 Security Considerations

1. **PIN Input**: Always masked, never logged
2. **API Calls**: Include authentication tokens
3. **Sensitive Data**: Never store in localStorage
4. **XSS Prevention**: Sanitize user inputs
5. **CSRF Protection**: Include tokens in requests

## 📦 Dependencies Required

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "react-query": "^3.39.0",
  "react-toastify": "^9.1.0",
  "axios": "^1.3.0",
  "date-fns": "^2.29.0",
  "react-hook-form": "^7.43.0",
  "zod": "^3.21.0",
  "recharts": "^2.5.0"
}
```

## 🎯 Next Steps

1. Implement Wallet Profile Page
2. Create Passenger Transfer Interface
3. Build Agent Deposit Interface
4. Develop Driver Dashboard components
5. Create Company management interfaces
6. Enhance existing components with new features
7. Add comprehensive error handling
8. Implement loading states throughout
9. Add accessibility features
10. Write component tests

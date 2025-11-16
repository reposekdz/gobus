# Implementation Guide - Comprehensive Bus Booking System Enhancements

## Quick Start

### 1. Database Migration

Run the comprehensive database migration:

```bash
mysql -u your_user -p your_database < backend/database-migrations/002_comprehensive_enhancements.sql
```

This will create all necessary tables and enhance existing ones.

### 2. Service Integration

All new services are located in `backend/src/services/`:
- `passenger-wallet.service.ts` - Passenger wallet with PIN protection
- `agent-deposit.service.ts` - Agent deposit with 1.5% fee
- `company-assignment.service.ts` - Bus-driver assignments
- `driver-dashboard.service.ts` - Driver dashboard features
- `otp.service.ts` - OTP verification (enhanced)
- `serial-code.service.ts` - Serial code generation

### 3. Controller Integration

New controllers available:
- `otp-registration.controller.ts` - OTP-based passenger registration
- Existing admin controllers enhanced for credential management
- Existing company controllers enhanced for gallery management

## Key Features Implemented

### ✅ Passenger Registration with OTP
- Mobile SMS OTP verification required
- Serial code auto-generation (3 letters + 4 numbers)
- Wallet created with 0 RWF balance
- PIN setup required before wallet use

### ✅ Wallet System
- PIN protection (4-6 digits)
- Passengers cannot deposit directly
- Only agents/platform can deposit
- Passenger-to-passenger transfers via serial codes
- Transaction history tracking

### ✅ Agent Deposit System
- Agents deposit using passenger serial codes
- 1.5% commission fee from company
- Full amount deposited to passenger
- Transaction tracking

### ✅ Company Withdrawal System
- 3% admin fee on all withdrawals
- Net amount sent to company after fee
- Fee tracking and reporting

### ✅ Company-Car-Driver Assignment
- Assign buses/drivers based on routes
- Assign buses/drivers based on bus stations
- General assignments supported
- Assignment tracking and cancellation

### ✅ Driver Dashboard
- View assigned trips
- See all passengers booked
- View seat map with booking info
- Confirm passenger boarding
- Mark passengers as no-show

### ✅ Company Gallery
- Upload gallery images
- Categorize images (bus, station, office, team, other)
- Featured image support
- Display order management

### ✅ Admin Credential Management
- Auto-generate secure credentials for companies
- Auto-generate secure credentials for agents
- Email credentials to users
- Companies/agents use provided credentials to login

## API Endpoints to Implement

### Passenger Registration (OTP)
```
POST /api/auth/register/request-otp
POST /api/auth/register/verify
POST /api/auth/register/resend-otp
```

### Wallet Management
```
POST /api/wallet/set-pin
PUT /api/wallet/update-pin
GET /api/wallet/balance
POST /api/wallet/transfer
GET /api/wallet/transactions
```

### Agent Services
```
POST /api/agent/deposit
GET /api/agent/deposits
GET /api/agent/stats
```

### Company Assignment
```
POST /api/companies/assignments
GET /api/companies/assignments
DELETE /api/companies/assignments/:id
```

### Driver Dashboard
```
GET /api/drivers/trips
GET /api/drivers/trips/:id/passengers
GET /api/drivers/trips/:id/seat-map
POST /api/drivers/boarding/confirm
GET /api/drivers/stats
```

### Company Gallery
```
POST /api/companies/gallery
GET /api/companies/gallery
PUT /api/companies/gallery/:id
DELETE /api/companies/gallery/:id
```

## Frontend Integration Checklist

- [ ] Passenger registration UI with OTP flow
- [ ] Wallet PIN setup screen
- [ ] Wallet profile page with balance
- [ ] Agent deposit interface
- [ ] Passenger transfer interface
- [ ] Driver dashboard with passenger list
- [ ] Driver seat map view
- [ ] Driver boarding confirmation UI
- [ ] Company assignment interface
- [ ] Company gallery upload/management UI
- [ ] Admin company/agent creation UI

## Environment Variables Required

```env
# SMS/OTP Configuration
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret
SMS_PROVIDER=mtn|airtel|twilio

# MTN Mobile Money
MTN_API_KEY=your_mtn_api_key
MTN_API_SECRET=your_mtn_api_secret
MTN_ENVIRONMENT=sandbox|production

# Email Service
EMAIL_SERVICE=sendgrid|nodemailer
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@gobus.rw

# JWT Secret
JWT_SECRET=your_jwt_secret

# Admin Fee Rate (default: 3%)
ADMIN_FEE_RATE=3.00

# Agent Fee Rate (default: 1.5%)
AGENT_FEE_RATE=1.50
```

## Testing Checklist

- [ ] Test passenger registration with OTP
- [ ] Test wallet PIN setup
- [ ] Test agent deposit to passenger
- [ ] Test passenger-to-passenger transfer
- [ ] Test company withdrawal with admin fee
- [ ] Test company-car-driver assignment
- [ ] Test driver dashboard features
- [ ] Test company gallery upload
- [ ] Test admin credential generation

## Security Considerations

1. **PIN Protection**
   - PINs hashed with bcrypt (12 rounds)
   - Lockout after 5 failed attempts (30 minutes)
   - PIN verification required for all transactions

2. **OTP Security**
   - 6-digit OTP
   - 10-minute expiration
   - Max 5 verification attempts

3. **Transaction Security**
   - Balance verification before transfers
   - Transaction references for tracking
   - Fee calculation validation

4. **API Security**
   - JWT authentication required
   - Role-based access control
   - Input validation and sanitization

## Next Steps

1. **Frontend Integration**
   - Implement UI components for all new features
   - Add form validations
   - Implement error handling
   - Add loading states

2. **Payment Security**
   - Implement PCI-DSS compliance
   - Add payment tokenization
   - Implement fraud detection
   - Add transaction monitoring

3. **Testing**
   - Unit tests for all services
   - Integration tests for API endpoints
   - E2E tests for critical flows

4. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - User guides for each role
   - Admin documentation

## Support

For questions or issues, refer to:
- `COMPREHENSIVE_ENHANCEMENTS_SUMMARY.md` - Detailed feature documentation
- Service files in `backend/src/services/` - Implementation details
- Controller files in `backend/src/api/` - API endpoint implementations

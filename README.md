# Backend Setup

This folder contains the Node.js/Express API for the Healthcare Appointment System.

## Environment Variables

The system uses a `.env` file at the project root. Some important variables:

```
MONGODB_URI=mongodb://localhost/yourdbname
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# Admin seeding (optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=abc123

# Khalti payment configuration
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_TEST=true   # set to 'true' to bypass real API calls (used by automated tests)
```

Make sure to obtain your Khalti public/secret keys from the Khalti dashboard.  The frontend reads the public key from `VITE_KHALTI_PUBLIC_KEY` (see frontend instructions below).

## Running Tests

Several backend test scripts exercise the API and they now expect Khalti payment fields when booking appointments.  The `KHALTI_TEST=true` flag allows tests to proceed without actual network calls by accepting a special token value (`"test"`).

```bash
node test_doctor.js
node test_doctor_search.js
# etc.
```

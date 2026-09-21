/**
 * Expense Tracker API - Debug Summary
 *
 * Run:
 *   npm install
 *   npm run dev
 *
 * API smoke test without MongoDB:
 *   npm run test:api
 */

console.log(`
Expense Tracker API

Fixed:
- Portable model import paths (Linux/Windows case consistency)
- JWT now stores MongoDB user _id and auth middleware reads the same value
- Authentication middleware is attached to protected routes
- Fixed req.user undefined errors on expense/income/budget/report APIs
- Added GET /api/expenses/:id
- Added protected user profile/update/delete operations
- Added input validation for IDs and required fields
- Prevented clients from changing transaction ownership through update bodies
- User profile no longer returns every user
- Password is excluded from user update/delete/profile responses
- Added consistent 404 handling
- Added API smoke-test script covering 29 endpoint scenarios

Important:
- The API uses MongoDB from MONGO_URI in .env.
- The test environment used for this debug run did not have a MongoDB server running,
  so the 29-case smoke test uses an in-memory model stub. Start MongoDB locally for
  real database integration testing.
`);

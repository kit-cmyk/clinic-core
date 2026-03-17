# Requirements Document

## Introduction

This feature covers user registration and authentication for ClinicCore 2.0, a multi-tenant SaaS clinic management platform. It includes email/password registration and login, Google OAuth sign-in and sign-up, and role selection during registration. All authentication is handled through Supabase Auth, with JWTs validated on every protected API endpoint. Every user record is scoped to a tenant, enforcing strict multi-tenancy.

## Glossary

- **Auth_Service**: The backend service layer responsible for orchestrating authentication and registration logic.
- **Supabase_Auth**: The third-party authentication provider (Supabase) used for identity management, JWT issuance, and OAuth flows.
- **JWT**: JSON Web Token issued by Supabase_Auth, used to authenticate requests to the backend API.
- **Auth_Middleware**: The Express middleware that validates the JWT on every protected API endpoint.
- **User**: A person with a verified identity record in the system, associated with exactly one tenant.
- **Tenant**: A clinic organisation that owns a set of users and data, identified by a unique `tenant_id`.
- **Role**: A named permission level assigned to a User within a Tenant. Valid values: `admin`, `doctor`, `nurse`, `receptionist`, `lab_technician`, `pharmacist`, `secretary`.
- **Registration_Controller**: The backend controller that handles new user registration requests.
- **Login_Controller**: The backend controller that handles user login requests.
- **OAuth_Controller**: The backend controller that handles Google OAuth callback and user provisioning.
- **Profile_Store**: The PostgreSQL table (via Prisma) that stores user profile data, including `tenant_id` and `role`.
- **Google_OAuth**: The OAuth 2.0 flow provided by Google and facilitated by Supabase_Auth.

---

## Requirements

### Requirement 1: Email/Password Registration

**User Story:** As a clinic staff member, I want to register with my email and password, so that I can create a verified account on ClinicCore.

#### Acceptance Criteria

1. WHEN a registration request is received with a valid email, password, `tenant_id`, and `role`, THE Registration_Controller SHALL create a new identity in Supabase_Auth and a corresponding profile record in Profile_Store.
2. WHEN a registration request is received, THE Auth_Service SHALL associate the new User with the provided `tenant_id` before persisting the profile record.
3. WHEN a registration request is received with a `role` value not in the set `{admin, doctor, nurse, receptionist, lab_technician, pharmacist, secretary}`, THE Registration_Controller SHALL return a 400 error with a descriptive validation message.
4. WHEN a registration request is received with an email that already exists in Supabase_Auth, THE Registration_Controller SHALL return a 409 error with a descriptive conflict message.
5. WHEN a registration request is received with a missing or malformed email, missing password, missing `tenant_id`, or missing `role`, THE Registration_Controller SHALL return a 400 error listing all invalid fields.
6. WHEN registration succeeds, THE Registration_Controller SHALL return a 201 response containing the user's profile (excluding password) and a JWT issued by Supabase_Auth.

---

### Requirement 2: Email/Password Login

**User Story:** As a registered clinic staff member, I want to log in with my email and password, so that I can access the platform.

#### Acceptance Criteria

1. WHEN a login request is received with a valid email and password, THE Login_Controller SHALL authenticate the credentials against Supabase_Auth and return a JWT and the user's profile.
2. WHEN a login request is received with an email that does not exist or a password that does not match, THE Login_Controller SHALL return a 401 error with a generic "invalid credentials" message.
3. WHEN a login request is received with a missing email or missing password, THE Login_Controller SHALL return a 400 error listing all missing fields.
4. WHEN login succeeds, THE Login_Controller SHALL include the user's `tenant_id` and `role` in the response payload.

---

### Requirement 3: Google OAuth Sign-In and Sign-Up

**User Story:** As a clinic staff member, I want to sign in or register using my Google account, so that I can access ClinicCore without managing a separate password.

#### Acceptance Criteria

1. WHEN a user initiates Google OAuth, THE OAuth_Controller SHALL redirect the user to the Google_OAuth consent screen via Supabase_Auth.
2. WHEN Google_OAuth returns a successful callback, THE OAuth_Controller SHALL exchange the authorisation code for a Supabase_Auth session and retrieve the authenticated identity.
3. WHEN Google_OAuth callback is received for an identity that does not have an existing profile in Profile_Store, THE OAuth_Controller SHALL treat the flow as a new registration and require a `tenant_id` and `role` to be provided before creating the profile record.
4. WHEN Google_OAuth callback is received for an identity that already has a profile in Profile_Store, THE OAuth_Controller SHALL treat the flow as a login and return the existing profile and a JWT.
5. WHEN Google_OAuth returns an error or the user denies consent, THE OAuth_Controller SHALL return a 400 error with a descriptive message.
6. WHEN a new user profile is created via Google_OAuth, THE Auth_Service SHALL associate the User with the provided `tenant_id` before persisting the profile record.

---

### Requirement 4: Role Selection During Registration

**User Story:** As a new clinic staff member, I want to select my role during registration, so that the system grants me the correct permissions from the start.

#### Acceptance Criteria

1. WHEN a registration request is received (via email/password or Google_OAuth), THE Registration_Controller SHALL require exactly one `role` value from the set `{admin, doctor, nurse, receptionist, lab_technician, pharmacist, secretary}`.
2. THE Profile_Store SHALL persist the selected `role` alongside the User's `tenant_id` and Supabase_Auth user ID.
3. WHEN a User's profile is retrieved after registration, THE Auth_Service SHALL return the `role` field in the profile response.

---

### Requirement 5: JWT Validation on Protected Endpoints

**User Story:** As a platform operator, I want every protected API endpoint to validate the Supabase JWT, so that only authenticated users can access protected resources.

#### Acceptance Criteria

1. WHEN a request is received on a protected endpoint without an `Authorization` header, THE Auth_Middleware SHALL return a 401 error.
2. WHEN a request is received on a protected endpoint with a JWT that is expired, malformed, or signed with an invalid key, THE Auth_Middleware SHALL return a 401 error.
3. WHEN a request is received on a protected endpoint with a valid JWT, THE Auth_Middleware SHALL extract the `user_id` and `tenant_id` from the JWT claims and attach them to the request context.
4. WHILE a request is being processed on a protected endpoint, THE Auth_Middleware SHALL make the `tenant_id` available so that all downstream database queries can filter by it.

---

### Requirement 6: Multi-Tenancy Enforcement

**User Story:** As a platform operator, I want every user record and query to be scoped to a tenant, so that data from different clinics is never mixed.

#### Acceptance Criteria

1. THE Profile_Store SHALL include a non-nullable `tenant_id` foreign key on every user profile record.
2. WHEN a profile record is created, THE Auth_Service SHALL reject the operation if `tenant_id` is absent or does not correspond to a known Tenant.
3. WHEN a profile query is executed, THE Auth_Service SHALL include a `tenant_id` filter on every query — no exceptions.
4. IF a request attempts to access or modify a profile record whose `tenant_id` does not match the `tenant_id` in the validated JWT, THEN THE Auth_Middleware SHALL return a 403 error.

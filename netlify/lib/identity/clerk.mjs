/**
 * Clerk implementation - UNWRITTEN, deliberately.
 *
 * The shape is settled and the four calls below map one-to-one onto Clerk's
 * Backend API, but two things need checking against a real Clerk project
 * before this is worth writing, and both are decision-blocking:
 *
 *   1. Username-only accounts. The practice has students with no email address
 *      of their own, so "username as the sole identifier" has to be enabled on
 *      the instance, and available on the plan in use.
 *   2. Forced password change. createUser() must be able to mark the initial
 *      password as needing a reset on first sign-in, which is what Keycloak's
 *      requiredActions: ['UPDATE_PASSWORD'] does today.
 *
 * Endpoints this would use (CLERK_SECRET_KEY as a bearer token):
 *   POST   /v1/users                 create, with username + password
 *   DELETE /v1/users/{id}            delete
 *   POST   /v1/users/{id}/lock       disable   (unlock to re-enable)
 *   GET    /v1/users/{id}/sessions   then POST /v1/sessions/{id}/revoke
 */
const NOT_IMPLEMENTED = () => {
  throw Object.assign(
    new Error('IDENTITY_PROVIDER=clerk selected but the Clerk adapter is not written yet'),
    { status: 501 },
  );
};

export const createUser     = NOT_IMPLEMENTED;
export const deleteUser     = NOT_IMPLEMENTED;
export const setUserEnabled = NOT_IMPLEMENTED;
export const logoutUser     = NOT_IMPLEMENTED;

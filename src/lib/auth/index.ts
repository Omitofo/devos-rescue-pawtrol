/**
 * Public auth surface — WP-03.
 */

export type { AppRole, AuthUser } from "./types";
export { ELEVATED_WINDOW_MINUTES, ELEVATED_COOKIE } from "./types";

export {
  getAuthUser,
  requireAuth,
  requireRole,
  requireOrgMember,
  requirePlatformStaff,
} from "./session";

export {
  grantElevatedWindow,
  clearElevatedWindow,
  hasElevatedWindow,
  elevatedRemainingSeconds,
  requireElevatedWindow,
} from "./elevated";

export {
  requestOrgOtp,
  verifyOrgOtp,
  orgPasswordLogin,
  adminPasswordLogin,
  signOut,
} from "./actions";
export type { ActionResult } from "./actions";

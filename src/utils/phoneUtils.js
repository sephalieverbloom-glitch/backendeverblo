/**
 * Phone Number Normalization Utility
 *
 * Converts Indian phone numbers into WhatsApp-compatible E.164 format (+91XXXXXXXXXX).
 * Handles all common Indian phone number formats:
 *   "9876543210"       → "+919876543210"
 *   "09876543210"      → "+919876543210"
 *   "+919876543210"    → "+919876543210"
 *   "91 9876543210"    → "+919876543210"
 *   "0091-98765-43210" → "+919876543210"
 */

/**
 * Strip all non-digit characters from a phone string
 */
const stripNonDigits = (phone) => (phone || "").replace(/\D/g, "");

/**
 * Validate that a 10-digit Indian mobile number starts with 6-9
 */
export const isValidIndianMobile = (phone) => {
  const digits = stripNonDigits(phone);

  // Extract the 10-digit core
  let core = digits;
  if (core.startsWith("91") && core.length === 12) {
    core = core.slice(2);
  } else if (core.startsWith("0") && core.length === 11) {
    core = core.slice(1);
  } else if (core.startsWith("0091") && core.length === 14) {
    core = core.slice(4);
  }

  return core.length === 10 && /^[6-9]/.test(core);
};

/**
 * Normalize any Indian phone number to E.164 format: +91XXXXXXXXXX
 * Returns null if the number is invalid.
 */
export const normalizeToE164 = (phone) => {
  if (!phone || typeof phone !== "string") return null;

  const digits = stripNonDigits(phone);
  if (!digits || digits.length < 10) return null;

  let core = digits;

  // Remove leading country code / trunk prefix variations
  if (core.startsWith("0091") && core.length === 14) {
    core = core.slice(4);
  } else if (core.startsWith("91") && core.length === 12) {
    core = core.slice(2);
  } else if (core.startsWith("0") && core.length === 11) {
    core = core.slice(1);
  }

  // Must be exactly 10 digits starting with 6-9
  if (core.length !== 10 || !/^[6-9]/.test(core)) return null;

  return `+91${core}`;
};

/**
 * Resolve the best available phone number for WhatsApp from order + user data.
 * Priority: shipping address phone → user mobile
 */
export const resolveWhatsAppPhone = (order, user) => {
  const candidates = [
    order?.shippingAddress?.phone,
    user?.mobile,
  ];

  for (const raw of candidates) {
    const normalized = normalizeToE164(raw);
    if (normalized) return normalized;
  }

  return null;
};

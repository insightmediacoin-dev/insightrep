export const PHONE_STORAGE_KEY = "insightrep_phone";
export const BUSINESS_ID_STORAGE_KEY = "insightrep_business_id";

/** @param {string} digits10 */
export function toE164India(digits10) {
  const d = digits10.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return null;
  return `+91${d}`;
}

/** @param {string} e164 */
export function isIndiaPhone(e164) {
  return /^\+91[6-9]\d{9}$/.test(e164);
}

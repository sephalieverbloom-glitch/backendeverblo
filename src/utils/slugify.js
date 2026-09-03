/**
 * Pure utility function to convert text into a URL-friendly slug.
 * Example: "Ullas Max 5 in 1 Agarbatti!" -> "ullas-max-5-in-1-agarbatti"
 *
 * @param {string} text - The input string to slugify
 * @returns {string} The formatted URL slug
 */
export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // Replace spaces, special characters, and dashes with a single dash
    .replace(/^-+|-+$/g, "");   // Remove leading/trailing dashes
};

export default slugify;

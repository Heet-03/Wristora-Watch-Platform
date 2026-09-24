/**
 * Universal Date Formatter for Wristora
 * Standardizes any date input (YYYY-MM-DD, ISO string, Firestore Timestamp, Date object)
 * into strict (DD/MM/YYYY) format.
 *
 * @param {string | number | Date | object} dateInput
 * @returns {string} Formatted date string "DD/MM/YYYY"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';

  // If already in DD/MM/YYYY
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }

  // Handle Firestore Timestamp object ({ toDate: () => Date }) or seconds
  if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
    dateInput = dateInput.toDate();
  } else if (dateInput?.seconds) {
    dateInput = new Date(dateInput.seconds * 1000);
  }

  // If string in YYYY-MM-DD or YYYY/MM/DD format (prevent timezone shifts)
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const match = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }

    // If month name string like "01 Aug 2026" or "August 2026"
    const parsedTime = Date.parse(trimmed);
    if (!isNaN(parsedTime)) {
      const d = new Date(parsedTime);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  // Handle Date instance or numeric timestamp
  try {
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback
  }

  return String(dateInput);
};

/**
 * Returns current date in DD/MM/YYYY format
 */
export const getCurrentDateDDMMYYYY = () => {
  return formatDate(new Date());
};

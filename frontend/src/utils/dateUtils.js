/**
 * Date, Time, and Validation Utilities for Vergil Tempo
 */

/**
 * Calculates hours between two time strings (HH:MM:SS or HH:MM)
 * @param {string} inStr Clock In time
 * @param {string} outStr Clock Out time
 * @returns {number|null} Duration in hours, or null if invalid or negative
 */
export const calculateHours = (inStr, outStr) => {
  if (!inStr || !outStr) return null;
  const [inH, inM, inS = 0] = inStr.split(':').map(Number);
  const [outH, outM, outS = 0] = outStr.split(':').map(Number);
  const inMin = inH * 60 + inM + inS / 60;
  const outMin = outH * 60 + outM + outS / 60;
  const diffMin = outMin - inMin;
  if (diffMin < 0) return null;
  return parseFloat((diffMin / 60).toFixed(2));
};

/**
 * Common validator for attendance log modifications and manual entries
 * @param {string} userId Candidate user ID
 * @param {string} clientCompany Client company name
 * @param {string} clockIn Clock in time string (HH:MM)
 * @param {string} clockOut Clock out time string (HH:MM)
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export const validateTimesheetForm = (userId, clientCompany, clockIn, clockOut) => {
  if (!userId) {
    return { isValid: false, error: 'Candidate selection is required.' };
  }

  const trimmedClientCompany = (clientCompany || '').trim();
  if (!trimmedClientCompany || trimmedClientCompany === 'N/A') {
    return { isValid: false, error: 'Selected candidate must belong to a valid client company.' };
  }

  if (!clockIn && !clockOut) {
    return { isValid: false, error: 'At least one of Clock In or Clock Out must be provided.' };
  }

  if (clockIn && clockOut) {
    const hrs = calculateHours(clockIn, clockOut);
    if (hrs === null) {
      return { isValid: false, error: 'Clock-out time cannot be earlier than clock-in time.' };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validates clock out recovery date and time
 * @param {string} recoveryDate date string YYYY-MM-DD
 * @param {number} hour 24h format hour
 * @param {number} minute minutes
 * @param {object} activeLog active log object with clockIn and date
 * @returns {{isValid: boolean, error: string|null}}
 */
export const validateRecoveryTime = (recoveryDate, hour, minute, activeLog) => {
  if (!recoveryDate) {
    return { isValid: false, error: 'Please select your actual clock-out date.' };
  }

  const [year, month, day] = recoveryDate.split('-').map(Number);
  const recoveryDateTime = new Date(year, month - 1, day, hour, minute, 0);

  if (activeLog && activeLog.clockIn) {
    const [inYear, inMonth, inDay] = activeLog.date.split('-').map(Number);
    const [inH, inM, inS = 0] = activeLog.clockIn.split(':').map(Number);
    const clockInDateTime = new Date(inYear, inMonth - 1, inDay, inH, inM, inS);
    if (recoveryDateTime.getTime() <= clockInDateTime.getTime()) {
      return { isValid: false, error: 'Clock Out time must be later than Clock In time.' };
    }
  }

  const nowLocal = new Date();
  if (recoveryDateTime.getTime() > nowLocal.getTime()) {
    return { isValid: false, error: 'Actual Clock Out Time cannot be in the future.' };
  }

  return { isValid: true, error: null };
};

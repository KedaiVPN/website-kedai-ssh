
const { parsePhoneNumber } = require('libphonenumber-js');

/**
 * Validates and formats a phone number.
 * Defaults to 'ID' (Indonesia) if no country code is provided.
 * Returns formatted E.164 number if valid, or null if invalid.
 */
function validatePhoneNumber(phoneNumber, defaultCountry = 'ID') {
  try {
    const phoneNumberObj = parsePhoneNumber(phoneNumber, defaultCountry);
    if (phoneNumberObj && phoneNumberObj.isValid()) {
      return phoneNumberObj.number; // E.164 format (e.g. +628123456789)
    }
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = { validatePhoneNumber };

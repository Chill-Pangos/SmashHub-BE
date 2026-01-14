/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param email - Email to validate
 * @returns boolean - True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 320) {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Password must have:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 * @param password - Password to validate
 * @returns object - { isValid: boolean, message?: string }
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for special characters (simplified to avoid ReDoS)
  const specialChars = "!@#$%^&*()_+-=[]{}';:\"|,.<>/?\\";
  const hasSpecialChar = password.split('').some(char => specialChars.includes(char));
  
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
};

/**
 * Validate email and throw error if invalid
 * @param email - Email to validate
 * @throws Error if email is invalid
 */
export const validateEmail = (email: string): void => {
  if (!email) {
    throw new Error("Email is required");
  }

  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
};

/**
 * Validate password and throw error if invalid
 * @param password - Password to validate
 * @throws Error if password is invalid
 */
export const validatePassword = (password: string): void => {
  if (!password) {
    throw new Error("Password is required");
  }

  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
};

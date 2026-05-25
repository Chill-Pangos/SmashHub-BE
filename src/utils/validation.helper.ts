import TournamentCategory from "../models/tournamentCategory.model";
import { Transaction } from "sequelize";

/**
 * General validation utilities (migrated here to follow *.helper.ts convention)
 */
/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 320) {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

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

  const specialChars = "!@#$%^&*()_+-=[]{}';:\"|,.<>/?\\";
  const hasSpecialChar = password.split("").some((char) => specialChars.includes(char));

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
};

export const validateEmail = (email: string): void => {
  if (!email) {
    throw new Error("Email is required");
  }

  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
};

export const validatePassword = (password: string): void => {
  if (!password) {
    throw new Error("Password is required");
  }

  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
};

export class ValidationHelper {
  /**
   * Verify category capacity
   */
  static async verifyCategoryCapacity(
    categoryId: number,
    currentCount: number,
    transaction?: Transaction | null
  ): Promise<void> {
    const category = await TournamentCategory.findByPk(categoryId, {
      ...(transaction && { transaction }),
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (currentCount >= category.maxEntries) {
      throw new Error('Maximum number of entries has been reached for this category');
    }
  }
}

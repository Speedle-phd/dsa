export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const passwordRegex =
   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export const usernameRules = {
   minLength: 3,
   maxLength: 30,
}

export const passwordRules = {
   minLength: 8,
}

export const emailValidationMessage = 'Please enter a valid email address'
export const passwordValidationMessage =
   'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'

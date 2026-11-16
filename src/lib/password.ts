// Same rule as the backend (validators.isValidPassword): 8-72 characters,
// no trim. 72 is the bcrypt limit
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const isValidPassword = (password: string) =>
  password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;

// Min 8 characters, max 72 bytes (bcrypt limit; diacritics and emoji take
// more than 1 byte). No trim
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const isValidPassword = (password: string) =>
  password.length >= PASSWORD_MIN &&
  new TextEncoder().encode(password).length <= PASSWORD_MAX;

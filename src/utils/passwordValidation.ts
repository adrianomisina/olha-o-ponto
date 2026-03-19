export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const passwordValidationMessage =
  'Use entre 8 e 128 caracteres, com 1 letra maiúscula, 1 número e 1 caractere especial.';

export const validatePassword = (password: string) => passwordRegex.test(password);

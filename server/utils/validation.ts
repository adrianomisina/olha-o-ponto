export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return passwordRegex.test(password);
};

export const passwordValidationMessage =
  'A senha deve ter entre 8 e 128 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.';

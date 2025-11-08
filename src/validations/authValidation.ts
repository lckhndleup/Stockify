import { z } from "zod";

export const loginFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(16, "Kullanıcı adı en fazla 16 karakter olabilir"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalıdır")
    .max(20, "Şifre en fazla 20 karakter olabilir"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormSchema = z.infer<typeof loginFormSchema>;

export const parseLoginForm = (input: unknown) => {
  const result = loginFormSchema.safeParse(input);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
};

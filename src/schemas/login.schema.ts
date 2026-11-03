import { z } from "zod";

// Mesajele sunt chei din "auth.errors" (i18n), traduse la afișare
export type LoginErrorKey = "emailRequired" | "emailInvalid" | "passwordRequired";
const error = (key: LoginErrorKey) => ({ message: key });

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, error("emailRequired"))
    .email(error("emailInvalid")),

  password: z.string().min(1, error("passwordRequired")),
});

export default LoginSchema;

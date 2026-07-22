import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu email')
  .email('Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'Senha precisa ter pelo menos 8 caracteres')
  .max(72, 'Senha muito longa');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo'),
    email: emailSchema,
    password: passwordSchema,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'É preciso aceitar os termos para continuar' }),
    }),
  })
  .strict();

export const recoverSchema = z.object({
  email: emailSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type RecoverInput = z.infer<typeof recoverSchema>;

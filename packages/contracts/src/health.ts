import { z } from 'zod';

/** Resposta de GET /api/health (E-13). Contrato compartilhado entre API e Web. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

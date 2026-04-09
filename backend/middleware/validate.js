/**
 * Middleware de validação com Zod.
 * Em caso de erro, responde 400 com { error, details } e não chama next.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.validated = result.data;
      next();
      return;
    }
    const details = result.error.flatten().fieldErrors;
    res.status(400).json({
      error: 'Dados inválidos.',
      details,
    });
  };
}

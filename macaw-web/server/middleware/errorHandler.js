/**
 * Tratamento centralizado de erros.
 * Não expõe stack trace nem mensagens internas em produção.
 */

export function notFound(req, res, next) {
  res.status(404).json({ error: 'Recurso não encontrado.' });
}

export function errorHandler(env = 'development') {
  return (err, req, res, next) => {
    const isDev = env === 'development';
    const status = err.statusCode ?? err.status ?? 500;
    const message = err.message ?? 'Erro interno do servidor.';
    const exposeMessage = status < 500 || isDev;

    if (status >= 500 && !isDev) {
      console.error('Erro interno:', err.message);
    } else if (isDev) {
      console.error(err);
    }

    res.status(status).json({
      error: exposeMessage ? message : 'Erro interno do servidor.',
      ...(isDev && err.stack && { stack: err.stack }),
    });
  };
}

/**
 * Validação de variáveis de ambiente na subida do servidor.
 * Falha rápido com mensagem clara; nunca loga valores sensíveis.
 */

const required = [
  'SQUARE_ACCESS_TOKEN',
  'SQUARE_LOCATION_ID',
];

const optional = {
  NODE_ENV: 'development',
  PORT: '3001',
  SQUARE_ENV: 'sandbox',
  CORS_ORIGIN: '',
  /** URL completa da página de sucesso no site (ex.: https://loja.com/checkout/complete). Usada no Payment Link (redirect após pagar). */
  CHECKOUT_SUCCESS_URL: '',
  /** Assinatura HMAC do webhook (Developer Dashboard → Webhooks → assinatura). */
  SQUARE_WEBHOOK_SIGNATURE_KEY: '',
  /** URL pública exatamente como cadastrada no webhook Square (ex.: https://api.loja.com/api/webhooks/square). */
  SQUARE_WEBHOOK_NOTIFICATION_URL: '',
  /** Apenas desenvolvimento: aceitar webhooks sem validar assinatura (não use em produção). */
  WEBHOOK_ALLOW_UNSIGNED: 'false',
};

function getEnv() {
  const env = { ...optional };
  for (const key of Object.keys(optional)) {
    if (process.env[key] !== undefined && process.env[key] !== '') {
      env[key] = process.env[key];
    }
  }
  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      throw new Error(
        `Variável de ambiente obrigatória ausente ou vazia: ${key}. ` +
          'Configure no arquivo .env (veja .env.example).'
      );
    }
    env[key] = value;
  }
  return env;
}

function validate(env) {
  const allowedEnvs = ['development', 'production', 'test'];
  if (!allowedEnvs.includes(env.NODE_ENV)) {
    throw new Error(`NODE_ENV deve ser um de: ${allowedEnvs.join(', ')}`);
  }
  const port = parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um número entre 1 e 65535');
  }
  if (!['sandbox', 'production'].includes(env.SQUARE_ENV)) {
    throw new Error('SQUARE_ENV deve ser "sandbox" ou "production"');
  }
  return { ...env, PORT: port };
}

let cached = null;

export function loadEnv() {
  if (cached) return cached;
  cached = validate(getEnv());
  return cached;
}

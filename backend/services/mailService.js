import nodemailer from 'nodemailer';

/**
 * Cria transporte SMTP a partir do env. Retorna null se credenciais não estiverem definidas.
 */
export function createSmtpTransport(env) {
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  if (!user || !pass) {
    return null;
  }
  const port = parseInt(env.SMTP_PORT || '465', 10);
  const host = env.SMTP_HOST?.trim() || 'smtp.hostinger.com';
  const secure = port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 && {
      secure: false,
      requireTLS: true,
    }),
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const POSITION_LABEL = {
  server: 'Server',
  prep: 'Prep',
  cashier: 'Cashier',
  manager: 'Manager',
  other: 'Other',
};

const POSITION_LABEL_PT = {
  server: 'Atendimento',
  prep: 'Prep',
  cashier: 'Caixa',
  manager: 'Gerente',
  other: 'Outro',
};

const DAY_GRID = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

function formatAvailabilityPlain(data) {
  const parts = [];
  for (const { key } of DAY_GRID) {
    const am = data[`${key}AM`];
    const pm = data[`${key}PM`];
    const slots = [];
    if (am) slots.push('AM');
    if (pm) slots.push('PM');
    if (slots.length) {
      parts.push(`${key}: ${slots.join(', ')}`);
    }
  }
  return parts.length ? parts.join('; ') : '(nenhum horário selecionado)';
}

function availabilityGridHtml(data) {
  const headCells = DAY_GRID.map(
    (d) =>
      `<td style="padding:10px 6px;text-align:center;font-size:11px;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e9d5ff;font-family:Arial,Helvetica,sans-serif;">${d.label}</td>`
  ).join('');
  const amCells = DAY_GRID.map((d) => {
    const on = data[`${d.key}AM`];
    const cell = on
      ? '<span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:9999px;background:#6d28d9;color:#fff;font-size:12px;font-weight:bold;text-align:center;">&#10003;</span>'
      : '<span style="color:#cbd5e1;font-size:14px;">&#8212;</span>';
    return `<td style="padding:12px 6px;text-align:center;vertical-align:middle;border-bottom:1px solid #f3e8ff;">${cell}</td>`;
  }).join('');
  const pmCells = DAY_GRID.map((d) => {
    const on = data[`${d.key}PM`];
    const cell = on
      ? '<span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:9999px;background:#7c3aed;color:#fff;font-size:12px;font-weight:bold;text-align:center;">&#10003;</span>'
      : '<span style="color:#cbd5e1;font-size:14px;">&#8212;</span>';
    return `<td style="padding:12px 6px;text-align:center;vertical-align:middle;">${cell}</td>`;
  }).join('');
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e9d5ff;">
  <tr>
    <td colspan="8" style="background:linear-gradient(90deg,#f3e8ff 0%,#ede9fe 100%);padding:12px 16px;font-size:13px;font-weight:700;color:#5b21b6;font-family:Arial,Helvetica,sans-serif;">Disponibilidade semanal</td>
  </tr>
  <tr style="background:#faf5ff;">
    <td style="width:56px;padding:10px 8px;font-size:11px;font-weight:600;color:#64748b;font-family:Arial,Helvetica,sans-serif;"></td>
    ${headCells}
  </tr>
  <tr>
    <td style="padding:10px 8px;font-size:12px;font-weight:600;color:#64748b;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;">Manhã</td>
    ${amCells}
  </tr>
  <tr style="background:#fafafa;">
    <td style="padding:10px 8px;font-size:12px;font-weight:600;color:#64748b;font-family:Arial,Helvetica,sans-serif;vertical-align:middle;">Tarde</td>
    ${pmCells}
  </tr>
</table>`;
}

function sectionTitle(title) {
  return `<tr><td style="padding:20px 0 10px 0;">
    <div style="font-size:12px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.08em;font-family:Arial,Helvetica,sans-serif;border-left:4px solid #6d28d9;padding-left:10px;">${title}</div>
  </td></tr>`;
}

function infoRow(label, value) {
  const v = value === undefined || value === null || String(value).trim() === '' ? '—' : String(value);
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:38%;vertical-align:top;padding:4px 12px 4px 0;font-size:13px;font-weight:600;color:#475569;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</td>
          <td style="vertical-align:top;padding:4px 0;font-size:14px;color:#0f172a;line-height:1.45;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(v)}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildHiringEmailHtml(data, file) {
  const name = `${data.firstName} ${data.lastName}`.trim();
  const address = [data.streetAddress, data.streetAddress2].filter(Boolean).join(', ');
  const position =
    POSITION_LABEL_PT[data.position] ?? POSITION_LABEL[data.position] ?? data.position;
  const submittedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const resumeBlock = file
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;">
      <tr>
        <td style="padding:16px 20px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:.04em;">Currículo anexado</div>
          <div style="font-size:14px;color:#065f46;margin-top:5px;font-weight:600;">${escapeHtml(file.originalname)}</div>
        </td>
      </tr>
    </table>`
    : `<div style="padding:14px 18px;background:#fffbeb;border-radius:12px;border:1px solid #fde68a;font-size:13px;color:#92400e;font-family:Arial,Helvetica,sans-serif;">
      Nenhum arquivo de currículo foi enviado neste formulário.
    </div>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Nova candidatura</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ff;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ff;">
    <tr>
      <td align="center" style="padding:30px 12px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6dcff;">
          <tr>
            <td style="background:#5b21b6;padding:28px 24px;text-align:center;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.1;font-weight:800;color:#ffffff;letter-spacing:.01em;">
                MACAW AÇAÍTERIA
              </div>
              <div style="margin-top:10px;display:inline-block;background:#ffffff20;border:1px solid #ffffff33;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;color:#e9d5ff;text-transform:uppercase;letter-spacing:.08em;font-family:Arial,Helvetica,sans-serif;">
                Nova candidatura recebida
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px 10px 24px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#3b0764;line-height:1.2;">${escapeHtml(name)}</div>
              <div style="margin-top:10px;font-size:14px;color:#475569;font-family:Arial,Helvetica,sans-serif;">
                <span style="color:#6d28d9;font-weight:700;">${escapeHtml(data.email)}</span>
                <span style="color:#cbd5e1;padding:0 8px;">•</span>
                <span>${escapeHtml(data.phone)}</span>
              </div>
              <div style="margin-top:8px;font-size:12px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">
                Enviado em ${escapeHtml(submittedAt)}
              </div>
            </td>
          </tr>
          <tr><td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${sectionTitle('Contato & endereço')}
              ${infoRow('Endereço', address)}
              ${infoRow('Cidade / Estado / CEP', `${data.city}, ${data.state} ${data.zipCode}`)}
              ${sectionTitle('Vaga')}
              ${infoRow('Cargo pretendido', position)}
              ${infoRow('Pretensão salarial', data.desiredSalary)}
              ${infoRow('Horas desejadas (semana)', data.hoursDesired)}
              ${sectionTitle('Saúde & restrições')}
              ${infoRow('Restrições físicas', data.physicalRestrictions)}
              <tr><td style="padding:16px 0 8px 0;">${availabilityGridHtml(data)}</td></tr>
              ${sectionTitle('Experiência anterior')}
              ${infoRow('Emprego 1', formatEmployer(data, 1))}
              ${infoRow('Emprego 2', formatEmployer(data, 2))}
            </table>
          </td></tr>
          <tr><td style="padding:18px 24px 26px 24px;">${resumeBlock}</td></tr>
          <tr>
            <td style="background:#faf7ff;padding:18px 24px 22px 24px;text-align:center;border-top:1px solid #ede9fe;">
              <div style="font-size:12px;color:#64748b;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
                Responda este e-mail para falar com o candidato (Reply-To automático).<br>
                <span style="color:#94a3b8;">Macaw Hiring • formulário do site</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatEmployer(data, n) {
  const company = data[`employer${n}Company`];
  if (!company?.trim()) return '—';
  const phone = data[`employer${n}Phone`] || '—';
  const start = data[`employer${n}Start`] || '—';
  const end = data[`employer${n}End`] || '—';
  const position = data[`employer${n}Position`] || '—';
  const contact = data[`employer${n}Contact`] || '—';
  return `${company} | Tel. ${phone} | ${start} – ${end} | Cargo: ${position} | Contatar ref.: ${contact}`;
}

/**
 * Envia e-mail ao responsável com os dados da candidatura.
 */
export async function sendHiringApplicationEmail(transport, env, data, file) {
  const notifyTo = env.HIRING_NOTIFY_TO?.trim();
  const from = env.MAIL_FROM?.trim() || env.SMTP_USER?.trim();
  if (!notifyTo || !from) {
    throw Object.assign(new Error('MAIL_FROM e HIRING_NOTIFY_TO devem estar configurados.'), {
      statusCode: 503,
    });
  }

  const name = `${data.firstName} ${data.lastName}`.trim();
  const subject = `[Macaw] Nova candidatura — ${name}`;

  const lines = [
    ['Nome', name],
    ['E-mail', data.email],
    ['Telefone', data.phone],
    ['Endereço', [data.streetAddress, data.streetAddress2].filter(Boolean).join(', ')],
    ['Cidade / Estado / CEP', `${data.city}, ${data.state} ${data.zipCode}`],
    ['Cargo', POSITION_LABEL_PT[data.position] ?? POSITION_LABEL[data.position] ?? data.position],
    ['Pretensão salarial', data.desiredSalary],
    ['Horas desejadas', data.hoursDesired || '—'],
    ['Disponibilidade', formatAvailabilityPlain(data)],
    ['Restrições físicas', data.physicalRestrictions || '—'],
    ['Emprego 1', formatEmployer(data, 1)],
    ['Emprego 2', formatEmployer(data, 2)],
  ];

  const textBody =
    lines.map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n') +
    (file ? `\n\nCurrículo anexo: ${file.originalname}` : '\n\n(Nenhum currículo anexo.)');

  const htmlBody = buildHiringEmailHtml(data, file);

  const attachments = file
    ? [
        {
          filename: file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 120),
          content: file.buffer,
          contentType: file.mimetype || undefined,
        },
      ]
    : undefined;

  await transport.sendMail({
    from: `Macaw Hiring <${from}>`,
    to: notifyTo,
    replyTo: data.email,
    subject,
    text: textBody,
    html: htmlBody,
    attachments,
  });
}

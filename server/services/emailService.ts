import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'Olha o Ponto <no-reply@olhaoponto.com>';
const supportEmail = process.env.SUPPORT_EMAIL || 'suporte@olhaoponto.com';

const hasPlaceholderValue = (value?: string) =>
  !value || value.includes('SUA_CHAVE_REAL_DO_RESEND') || value.includes('COLE_AQUI');

export const isEmailDeliveryConfigured = () =>
  !hasPlaceholderValue(resendApiKey) && !hasPlaceholderValue(emailFrom);

const resend = isEmailDeliveryConfigured() ? new Resend(resendApiKey as string) : null;

const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) => {
  if (!resend) {
    console.warn(`[EMAIL DISABLED] ${subject} ->`, to);
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async ({
  to,
  userName,
  resetUrl,
}: {
  to: string;
  userName: string;
  resetUrl: string;
}) => {
  await sendEmail({
    to,
    subject: 'Redefina sua senha no Olha o Ponto',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Recuperação de senha</h2>
        <p>Olá, ${userName}.</p>
        <p>Recebemos uma solicitação para redefinir sua senha no <strong>Olha o Ponto</strong>.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
            Redefinir minha senha
          </a>
        </p>
        <p>Se o botão não abrir, use este link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Se você não fez esta solicitação, pode ignorar este email.</p>
        <p style="font-size:12px;color:#6b7280;">Suporte: ${supportEmail}</p>
      </div>
    `,
  });
};

export const sendEmployeeAccessRequestEmail = async ({
  to,
  adminName,
  employeeName,
  employeeEmail,
  message,
  approvalsUrl,
}: {
  to: string;
  adminName: string;
  employeeName: string;
  employeeEmail: string;
  message: string;
  approvalsUrl: string;
}) => {
  await sendEmail({
    to,
    subject: 'Novo pedido de acesso de funcionário',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Solicitação de acesso</h2>
        <p>Olá, ${adminName}.</p>
        <p>O funcionário <strong>${employeeName}</strong> solicitou ajuda para recuperar o acesso.</p>
        <p><strong>Email do funcionário:</strong> ${employeeEmail}</p>
        <p><strong>Mensagem:</strong></p>
        <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #2563eb;background:#f3f4f6;">${message}</blockquote>
        <p>
          <a href="${approvalsUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
            Abrir painel de aprovações
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280;">Suporte: ${supportEmail}</p>
      </div>
    `,
  });
};

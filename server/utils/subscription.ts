const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || '7');
const TRIAL_DURATION_MS = Math.max(TRIAL_DAYS, 0) * 24 * 60 * 60 * 1000;

export const getTrialEndsAt = (company: {
  trialEndsAt?: Date | string | null;
  createdAt?: Date | string | null;
}) => {
  if (company.trialEndsAt) {
    return new Date(company.trialEndsAt);
  }

  if (company.createdAt) {
    return new Date(new Date(company.createdAt).getTime() + TRIAL_DURATION_MS);
  }

  return new Date(Date.now() + TRIAL_DURATION_MS);
};

export const getSubscriptionSnapshot = (company: {
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  createdAt?: Date | string | null;
}) => {
  const trialEndsAt = getTrialEndsAt(company);
  const isPaid = company.subscriptionStatus === 'paid';
  const isBlocked = !isPaid && Date.now() > trialEndsAt.getTime();

  return {
    trialEndsAt,
    isPaid,
    isBlocked,
    effectiveStatus: isPaid ? 'paid' : isBlocked ? 'blocked' : 'pending',
  };
};

export const getSubscriptionBlockedMessage = (trialEndsAt: Date) => {
  const formattedDate = trialEndsAt.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `A assinatura da empresa está bloqueada por falta de pagamento. O período de teste terminou em ${formattedDate}.`;
};

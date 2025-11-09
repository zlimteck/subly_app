// Translations for push notifications
export const translations = {
  en: {
    trialEndingSoon: {
      title: 'Trial Ending Soon',
      body: (subscriptionName, daysLeft) =>
        `Your ${subscriptionName} trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`
    },
    upcomingPayment: {
      title: 'Upcoming Payment',
      body: (subscriptionName, daysUntil, amount) =>
        `${subscriptionName} renews in ${daysUntil} day${daysUntil > 1 ? 's' : ''} - ${amount.toFixed(2)}€`
    }
  },
  fr: {
    trialEndingSoon: {
      title: 'Votre période d\'essai arrive à expiration',
      body: (subscriptionName, daysLeft) =>
        `La période d'essai de ${subscriptionName} se termine dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
    },
    upcomingPayment: {
      title: 'Paiement à venir',
      body: (subscriptionName, daysUntil, amount) =>
        `${subscriptionName} se renouvelle dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} - ${amount.toFixed(2)}€`
    }
  }
};

export function getTranslation(language, key, ...args) {
  const lang = translations[language] || translations.en;
  const translation = lang[key];

  if (!translation) {
    return translations.en[key];
  }

  return {
    title: translation.title,
    body: translation.body(...args)
  };
}
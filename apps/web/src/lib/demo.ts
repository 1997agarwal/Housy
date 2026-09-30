// Demo mode: on-screen OTP codes and simulated crew/expert actions. Automatic outside production; in production only
// when explicitly enabled (HOUSY_DEV_OTP=1) — anyone can then act as the crew, so use it for public demos only.
export const isDemoMode = () => process.env.NODE_ENV !== 'production' || process.env.HOUSY_DEV_OTP === '1';

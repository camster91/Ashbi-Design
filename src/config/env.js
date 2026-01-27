// Environment configuration

const env = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '7d',

  // AI
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  aiModel: 'claude-sonnet-4-20250514',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Webhook
  webhookSecret: process.env.WEBHOOK_SECRET,

  // Match confidence thresholds
  autoMatchThreshold: 0.85,
  suggestMatchThreshold: 0.5,

  // SLA defaults (in hours)
  slaDefaults: {
    CRITICAL: 2,
    HIGH: 4,
    NORMAL: 24,
    LOW: 72
  }
};

// Validate required env vars in production
if (!env.isDev) {
  const required = ['JWT_SECRET', 'ANTHROPIC_API_KEY', 'WEBHOOK_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default env;

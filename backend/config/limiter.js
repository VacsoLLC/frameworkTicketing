// Rate limiter configuration. in seconds. Uses the `rate-limiter-flexible` package.
export default {
  general: {
    points: 10 * 60 * 5, // 10 points per second over 5 minutes
    duration: 60 * 5, // Store number for five minutes
    block: 60 * 5, // Block for 5 minutes
  },
  failedLogin: {
    ip: {
      points: 10,
      duration: 60 * 5, // Store number for five minutes
      block: 60 * 15, // Block for 15 minutes
    },
    user: {
      points: 5,
      duration: 60 * 5, // Store number for five minutes
      block: 60 * 15, // Block for 15 minutes
    },
  },
};

import winston, { createLogger } from "winston"

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.errors({ stack: true }),
    winston.format.timestamp({
      format: "YY-MM-DD HH:mm:ss"
    }),
    winston.format.printf(
      info => `[${info.timestamp}] ${info.level}: ${info.message}` + (info.stack ? `\n${info.stack}` : "")
    )
  ),
  transports: [
    new winston.transports.Console(),
  ]
})

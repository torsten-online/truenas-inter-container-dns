import winston, { createLogger } from "winston"

export const logger = createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: "YY-MM-DD HH:mm:ss"
    }),
    winston.format.printf(
      info => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
  ]
})

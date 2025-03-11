// src/lib/utils/logger.ts
import winston from "winston";

let logger: winston.Logger | Console;

if (typeof window === "undefined") {
  // Server-side: Use winston for logging to files
  logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
      }),
      new winston.transports.File({ filename: "logs/combined.log" }),
      new winston.transports.Console(),
    ],
  });
} else {
  // Client-side: Fall back to console for logging
  logger = console;
}

export default logger;

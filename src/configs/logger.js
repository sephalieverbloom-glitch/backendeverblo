import winston from "winston";

const transports = [
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === "production"
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

// In serverless environments (like Vercel), local filesystem is read-only
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  try {
    transports.push(
      new winston.transports.File({ filename: "security.log", level: "warn" }),
      new winston.transports.File({ filename: "error.log", level: "error" })
    );
  } catch {
    // Ignore file write errors in restricted environments
  }
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports,
});

export default logger;
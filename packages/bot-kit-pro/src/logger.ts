import pino from "pino"

export function createLogger(
  useJson: boolean,
  level: pino.Level,
  name: string,
  metadata?: { [k: string]: string },
) {
  return pino({
    name,
    level,
    ...(!useJson
      ? {
          transport: {
            target: "pino-pretty",
          },
        }
      : {}),
  }).child(metadata || {})
}

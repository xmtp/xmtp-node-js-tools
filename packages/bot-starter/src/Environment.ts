export type ProcessEnv = {
  KEY: string | undefined
  XMTP_ENV: "dev" | "production"
}

declare module "process" {
  interface Process {
    env: ProcessEnv
  }
}

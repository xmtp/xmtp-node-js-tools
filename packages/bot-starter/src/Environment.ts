export type ProcessEnv = NodeJS.ProcessEnv & {
  KEY?: string
  XMTP_ENV?: "dev" | "production"
}

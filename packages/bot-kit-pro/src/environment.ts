/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      KEY: string | undefined
      XMTP_ENV: "dev" | "production"
    }
  }
}

export {}

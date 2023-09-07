import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema.ts",
  out: "./src/migrations",
  dbCredentials: {
    host: "localhost",
    port: 4321,
    database: "postgres",
    password: "xmtp",
  },
} satisfies Config

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { AppConfig } from "../config.js"

// Convert Postgres config into a connections string
export function buildConnectionString(dbConfig: AppConfig["db"]) {
  return `postgres://${dbConfig.postgresUser}:${dbConfig.postgresPassword}@${dbConfig.postgresHost}:${dbConfig.postgresPort}/${dbConfig.postgresDb}`
}

export async function buildDrizzle(dbConfig: AppConfig["db"]) {
  const queryClient = postgres(buildConnectionString(dbConfig))

  return {
    db: drizzle(queryClient),
    connection: queryClient,
  }
}

// Create a database instance, but with the max number of connections set to 1
export async function buildMigrator(dbConfig: AppConfig["db"]) {
  const migrationClient = postgres(buildConnectionString(dbConfig), {
    max: 1,
    onnotice: () => {},
  })
  return {
    db: drizzle(migrationClient),
    connection: migrationClient,
  }
}

export async function doMigrations(dbConfig: AppConfig["db"]) {
  const { connection, db } = await buildMigrator(dbConfig)
  await migrate(db, { migrationsFolder: "./src/migrations" })
  await connection.end()
}

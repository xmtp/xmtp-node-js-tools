import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { AppConfig } from "../config.js"

export async function buildDrizzle(dbConfig: AppConfig["db"]) {
  const queryClient = postgres(dbConfig.postgresConnectionString)

  return {
    db: drizzle(queryClient),
    connection: queryClient,
  }
}

// Create a database instance, but with the max number of connections set to 1
export async function buildMigrator(dbConfig: AppConfig["db"]) {
  const migrationClient = postgres(dbConfig.postgresConnectionString, {
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
  const migrationsFolder = resolve(
    fileURLToPath(import.meta.url),
    "../../migrations",
  )
  console.log("MIGRATIONS FOLDER", migrationsFolder)
  await migrate(db, {
    migrationsFolder,
  })
  await connection.end()
}

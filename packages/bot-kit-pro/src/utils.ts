import { PrivateKeyBundleV1 } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"

export function getEnv(key: string): string | undefined {
  return process.env[key]
}

export function requireEnv(key: string): string {
  const value = getEnv(key)
  if (!value) {
    throw new Error(`Missing environment variable ${key}`)
  }
  return value
}

export function getEnvOrDefault(key: string, defaultVal: string): string {
  return getEnv(key) || defaultVal
}

export async function randomKeys() {
  const wallet = Wallet.createRandom()
  const bundle = await PrivateKeyBundleV1.generate(wallet)
  return bundle.encode()
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

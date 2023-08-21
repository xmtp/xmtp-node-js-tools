export function hexToBytes(s: string): Uint8Array {
  if (s.startsWith("0x")) {
    s = s.slice(2)
  }
  const bytes = new Uint8Array(s.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const j = i * 2
    bytes[i] = Number.parseInt(s.slice(j, j + 2), 16)
  }
  return bytes
}

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

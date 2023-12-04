import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import "./Environment";
import dotenv from "dotenv";
dotenv.config();

export default async function createClient(): Promise<Client> {
  let wallet: Wallet;
  const key = process.env.KEY;

  if (key) {
    wallet = new Wallet(key);
  } else {
    wallet = Wallet.createRandom();
    console.log("Set your environment variable: KEY=" + wallet.privateKey);
  }

  const client = await Client.create(wallet, {
    env: process.env.XMTP_ENV || "production",
  });

  await client.publishUserContact();

  return client;
}

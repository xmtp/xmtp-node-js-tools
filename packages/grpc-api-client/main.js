import { GrpcApiClient } from "@xmtp/grpc-api-client"
import { Client } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"

const main = async () => {
  try {
    const client = await Client.create(Wallet.createRandom(), {
      env: "production",
    })
    console.log("Non grpc:", client.address)
    const clientA = await Client.create(Wallet.createRandom(), {
      env: "production",
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    console.log("Grpc1:", clientA.address)
    const clientB = await Client.create(Wallet.createRandom(), {
      env: "production",
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    console.log("Grpc2:", clientB.address)
  } catch (e) {
    console.log(e)
  }
}

main()

import { Client } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"
import { GrpcApiClient } from "@xmtp/grpc-api-client"

const main = async () => {
  console.log("je")
  try {
    const client = await Client.create(Wallet.createRandom())
    console.log(client.address)
    const clientA = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    console.log(clientA.address)
    const clientB = await Client.create(Wallet.createRandom(), {
      apiClientFactory: GrpcApiClient.fromOptions,
    })
    console.log(clientB.address)
  } catch (e) {
    console.log(e)
  }
}

main()

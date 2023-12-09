beforeEach(() => {
  jest.setTimeout(10000) // 5 minutes
})
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require("child_process")

describe("XMTP CLI", () => {
  it("should initialize a new wallet", (done) => {
    exec(
      "./xmtp list-messages 0xF8cd371Ae43e1A6a9bafBB4FD48707607D24aE43",
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`)
          done(error)
          return
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
          done(new Error(stderr))
          return
        }
        console.log(`stdout: ${stdout}`)
        done()
      },
    )
  }, 10000) // timeout increased to 10 seconds
})

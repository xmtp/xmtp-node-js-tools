const { exec } = require('child_process');

describe('XMTP CLI', () => {
  it('should initialize a new wallet', (done) => {
    exec('./xmtp init', (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      done();
    });
  });
});
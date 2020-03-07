const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require("worker_threads");

let a = 10;

if (isMainThread) {
  module.exports = async function parseJSAsync(num) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: num
      });
      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });

      for (let i = 0; i < num; i++) {
        console.log("master: ", a);
        a++;
      }
    });
  };
} else {
  const num = workerData;
  let result = 1;
  for (let i = 1; i < num; i++) {
    console.log("worker: ", a);
    a--;
    result = result * i;
  }
  parentPort.postMessage(result);
}

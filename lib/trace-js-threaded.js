'use strict';
const traceJs = require('./trace-js');
let workerThreads;
try {
  // nodejs v10.5+
  workerThreads = require('worker_threads');
} catch (e) {
  // old nodejs
  module.exports = traceJs;
  return;
}

const {
  Worker, isMainThread, parentPort
} = workerThreads;
const numCPUs = require('os').cpus().length;
const workerCount = Math.min(numCPUs, 7);

if (!isMainThread) {
  parentPort.on('message', msg => {
    const {id, unit} = msg;
    traceJs(unit).then(
      result => {
        parentPort.postMessage({id, result});
      },
      error => {
        parentPort.postMessage({id, error});
      }
    );
  });
  return;
}

const promises = {};
let seed = 0;
let workers = [];

function handleResult({id, result, error}) {
  if (error) {
    promises[id].reject(error);
  } else {
    promises[id].resolve(result);
  }
  delete promises[id];
}

function handleError(error) {
  console.error('Worker error: ' + error.message);
}

// function handleExit(code) {
//   if (code !== 0) {
//     console.error(`Worker stopped with exit code ${code}`);
//   }
// }

function prepareWorkers() {
  if (workers.length) return;
  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker(__filename);
    worker.on('message', handleResult);
    worker.on('error', handleError);
    // worker.on('exit', handleExit);
    // console.log(`Worker ${worker.threadId} is up.`);
    workers.push({worker, mb: 0});
  }
}


function traceJsWithThreads(unit) {
  prepareWorkers();

  const p = new Promise((resolve, reject) => {
    promises[seed] = {resolve, reject};
  });

  let min = -1;
  let minIdx;
  for (let i = 0; i < workers.length; i++) {
    if (min < 0 || min > workers[i].mb) {
      min = workers[i].mb;
      minIdx = i;
    }
  }

  workers[minIdx].worker.postMessage({id: seed, unit});
  workers[minIdx].mb += unit.contents.length;

  seed += 1;
  return p;
}

traceJsWithThreads.terminate = function() {
  const _workers = workers;
  workers = [];
  return Promise.all(_workers.map(w => w.worker.terminate()));
}

module.exports = traceJsWithThreads;

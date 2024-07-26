const queue: any = [];
const p = Promise.resolve();
let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;

  isFlushPending = true;

  nextTick(flushJobs);
}

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}

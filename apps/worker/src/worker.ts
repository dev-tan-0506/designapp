import { validateEnv } from '@design-editor/common-types';
import { Worker } from 'bullmq';

const env = validateEnv('worker');
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

const queues = ['import-jobs', 'export-jobs'] as const;

for (const queueName of queues) {
  const worker = new Worker(
    queueName,
    async () => {
      return { queueName, status: 'accepted' };
    },
    { connection },
  );

  worker.on('completed', (job) => {
    console.log(`[worker] completed ${queueName} job ${job.id}`);
  });
}

console.log('[worker] consumers registered');

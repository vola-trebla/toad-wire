import 'dotenv/config';
import { initObservability, shutdown } from 'toad-eye';

initObservability({
  serviceName: 'toad-wire',
  instrument: ['ai'],
});

const { runNewsPipeline } = await import('./src/orchestration/news-pipeline.js');

console.log('🐸 Triggering one news pipeline run...\n');
await runNewsPipeline(1);
console.log('\n🐸 Flushing telemetry...');
await shutdown();
console.log('✅ Done. Check Jaeger for toad-wire service.');

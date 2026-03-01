/**
 * Test night image generation + Telegram post
 * Usage: npx tsx src/debug/test-night.ts
 */

import 'dotenv/config';
import { generateGoodNight } from '../pipeline/summarize.js';
import { generateNightImage } from '../images/generate-image.js';
import { sendToTelegram, sendToTelegramWithPhoto } from '../pipeline/post.js';

async function main() {
  console.log('🌙 Testing night image pipeline...\n');

  // 1. Generate goodnight message
  console.log('📝 Generating goodnight message...');
  const goodNightMsg = await generateGoodNight();
  console.log(`\nMessage:\n${goodNightMsg}\n`);

  // 2. Generate night image
  console.log('🎨 Generating night image...');
  const image = await generateNightImage(goodNightMsg);

  if (!image) {
    console.log('❌ Image generation failed — sending text only');
    await sendToTelegram(goodNightMsg);
    return;
  }

  console.log(`✅ Image generated — style: ${image.style}`);
  console.log(`   Descriptor: ${image.descriptor}`);
  console.log(`   Size: ${(image.data.length / 1024).toFixed(1)} KB\n`);

  // 3. Send to Telegram
  console.log('📨 Sending to Telegram...');
  await sendToTelegramWithPhoto(image.data, goodNightMsg);
  console.log('✅ Done!');
}

main().catch(console.error);

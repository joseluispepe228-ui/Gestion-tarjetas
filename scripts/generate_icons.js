import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#3730A3" />
    </linearGradient>
    <linearGradient id="card" x1="50" y1="120" x2="420" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.08" />
    </linearGradient>
    <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Squircle Base Background -->
  <rect x="0" y="0" width="512" height="512" rx="115" fill="url(#bg)" />

  <!-- Glassy Credit Card Vector -->
  <g filter="url(#shadow)">
    <rect x="56" y="128" width="400" height="256" rx="28" fill="url(#card)" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.3" />
    <!-- Magnetic Stripe / Accent -->
    <rect x="56" y="180" width="400" height="48" fill="#1E1B4B" fill-opacity="0.6" />
    
    <!-- Chip -->
    <rect x="100" y="250" width="56" height="44" rx="8" fill="url(#chip)" />
    <path d="M118 250V294M138 250V294M100 272H156" stroke="#B45309" stroke-width="2" />

    <!-- Card Numbers Lines -->
    <rect x="176" y="262" width="60" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.9" />
    <rect x="246" y="262" width="60" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.9" />
    <rect x="316" y="262" width="60" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.9" />
    <rect x="386" y="262" width="40" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.9" />

    <!-- Contactless Icon -->
    <path d="M410 152 A 16 16 0 0 1 410 176" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8" />
    <path d="M402 156 A 10 10 0 0 1 402 172" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8" />
  </g>

  <!-- Green Checkmark Badge for Control & Payments -->
  <circle cx="390" cy="370" r="48" fill="#10B981" stroke="#FFFFFF" stroke-width="6" />
  <path d="M368 370L382 384L412 354" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svgIcon(512));

  // Save 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Save 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  // Save 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon(512));

  console.log('App icons generated successfully in /public!');
}

generate().catch(console.error);

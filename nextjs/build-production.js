const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('=== Step 1: Building Frontend ===');
  execSync('npm install', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });
  execSync('npm run build', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });

  console.log('=== Step 2: Copying build assets to Next.js public ===');
  const src = path.join(__dirname, '../frontend/dist');
  const dest = path.join(__dirname, 'public');

  if (fs.existsSync(src)) {
    // Standard Node recursive copy
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log('Static assets copied successfully.');
  } else {
    throw new Error('Frontend build directory not found.');
  }

  console.log('=== Step 3: Generating Prisma Client ===');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('=== Step 4: Building Next.js API Server ===');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('=== Production Build Completed Successfully! ===');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}

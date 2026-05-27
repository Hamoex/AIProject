/**
 * AI ELITE AI — Build Script (Standard)
 *
 * Runs electron-builder to produce a normal build with standard app.asar.
 */

const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

console.log('='.repeat(60));
console.log('  Building AI ELITE AI (standard electron-builder)');
console.log('='.repeat(60));

run('npx electron-builder --win');

console.log('\n' + '█'.repeat(60));
console.log('  BUILD COMPLETE');
console.log('  ─────────────────────────────────────────────────────────');
console.log('  Standard app.asar in resources/');
console.log('  Output: release/ directory');
console.log('█'.repeat(60));

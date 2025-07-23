// Quick test to see available block-editor components
const blockEditor = require('@wordpress/block-editor');

console.log('Available @wordpress/block-editor components:');
Object.keys(blockEditor).forEach(key => {
  if (key.toLowerCase().includes('toolbar')) {
    console.log(`- ${key}`);
  }
});

console.log('\nAll components:');
console.log(Object.keys(blockEditor).sort().join(', '));
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // Entry point
  format: ['cjs', 'esm'], // Output formats: CommonJS and ESModule
  dts: true, // Generate .d.ts files
  splitting: false, // For libraries, often better to have single files per format
  sourcemap: true, // Generate sourcemaps
  clean: true, // Clean output directory before build
  external: ['react', 'react-dom'], // Externalize React to use the consumer's version
  minify: true, // Minify output
  target: 'es2017', // Target modern browsers, aligns with tsconfig
  outDir: 'dist', // Output directory
  // onSuccess: 'echo "Build successful!"', // Optional: command to run on success
});

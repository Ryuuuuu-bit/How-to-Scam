import fs from 'node:fs';
import process from 'node:process';

// pnpm links must be resolved to their store paths for transitive declarations.
// Some managed Windows folders allow readlink but reject native realpath.
if (process.platform === 'win32') {
  const nativeRealpath = fs.realpathSync.native;
  fs.realpathSync.native = (path, options) => {
    try {
      return nativeRealpath(path, options);
    } catch (error) {
      if (error.code !== 'EPERM') throw error;
      return fs.realpathSync(path, options);
    }
  };
}

await import('typescript/bin/tsc');

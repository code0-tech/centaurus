import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
    build: {
        target: 'node18',
        ssr: true,
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.ts'),
                generateTypes: resolve(__dirname, 'scripts/generateTypes.ts')
            },
            external: [
                'fs',
                'path',
                'os',
                'crypto',
                'stream',
                'util',
                'events',
                'buffer',
                'url',
                'zlib',
                'node:fs',
                'node:path'
            ]
        }
    }
});
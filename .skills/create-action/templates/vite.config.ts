import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        target: "node18",
        ssr: resolve(__dirname, 'src/index.ts'),
        rollupOptions: {
            // Runtime dependencies stay external: they are installed in the image
            // by `npm ci`. Add every package from "dependencies" here.
            external: (id) =>
                [
                    'fs',
                    'path',
                    'typescript',
                    '@code0-tech/hercules',
                    '__VENDOR_SDK__'
                ].includes(id) || id.startsWith('node:')
        }
    }
});

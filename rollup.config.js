import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from '@rollup-extras/plugin-copy';

export default [
  {
    input: './src/soccerNET.mjs',
    output: [{
      dir: './dist/browser',
      format: 'es', // Output as an ES module (.mjs)
      sourcemap: true, // Generate a sourcemap for debugging
    }],
    plugins: [
      nodeResolve({
        browser: true, // Resolve browser-specific modules
      }),
      commonjs(),
      terser(), // Minify the output in production mode
      copy({
        targets: [
          {
            src: 'node_modules/onnxruntime-web/dist/*.wasm',
            dest: './'
          }
        ]
      }),
    ],
  },
  {
    input: './src/soccerNET.mjs',
    output: [{
      dir: './dist/node',
      format: 'es',
      sourcemap: true,
    }],
    plugins: [
      nodeResolve({
        browser: false, 
      }),
      commonjs({
        dynamicRequireTargets: [
          `./node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/onnxruntime_binding.node`,
          `./node_modules/@huggingface/transformers/node_modules/onnxruntime-node/bin/napi-v3/${process.platform}/${process.arch}/onnxruntime_binding.node`
        ],
        ignoreDynamicRequires: false,
      }),
      terser(),
    ],
    external: ['onnxruntime-node','@huggingface/transformers','@danielruss/clips'],
  }
];
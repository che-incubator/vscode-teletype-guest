import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';

const MODULE_NAME = 'vsapi';

const ResolvePlugin = resolve({
  browser: true,
});

const TerserPlugin = terser({
  compress: true,
});

export default {
  input: 'vsapi/index.ts',
  cache: true,
  output: {
    file: `media/${MODULE_NAME}.min.js`,
    format: 'umd',
    name: MODULE_NAME,
    indent: false,
    sourcemap: 'inline',
    exports: 'named',
  },
  plugins: [
    ResolvePlugin,
    typescript({
      target: 'es5',
      tsconfig: 'tsconfig.vsapi.json',
    }),
    TerserPlugin,
  ],
};

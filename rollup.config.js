import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";

import pkg from './package.json'

const config = {
    input: './index.ts',
    external: [
        ...Object.keys(pkg.dependencies || {})
    ],
    output: [
        {
            file: pkg.main,
            format: 'cjs'
        },
    ],
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
            clean: true
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        terser(),
    ],
    onwarn: (warning, rollupWarn) => {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
          rollupWarn(warning);
        }
    }
}

export default config
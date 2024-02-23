import typescript from '@rollup/plugin-typescript'
import { bannerString } from './webpack.config.mjs'

export default [
  {
    input: 'src/main.ts',
    output: {
      file: 'dist/jspdf.plugin.autotable.mjs',
      name: 'jspdfAutoTable',
      format: 'es',
      banner: bannerString(),
    },
    plugins: [typescript()],
  },
]

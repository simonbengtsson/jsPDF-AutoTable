import typescript from '@rollup/plugin-typescript'

export default [
  {
    input: 'src/main.ts',
    output: {
      file: 'dist/jspdf.plugin.autotable.mjs',
      name: 'jspdfAutoTable',
      format: 'es',
    },
    plugins: [typescript()],
  },
]

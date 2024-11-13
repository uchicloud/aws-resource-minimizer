const result = await Bun.build({
    entrypoints: ['lambda.ts'],
    outdir: 'out',
    target: 'node',
});


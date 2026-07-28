import sharp from 'sharp';

// Trim transparent padding so the character fills its own frame, then re-encode.
// Source art had 42-56% empty alpha, which made bg-contain render the subject tiny.
for (const [src, out] of [
  ['public/operadores.png', 'public/operador'],
  ['public/anjo-6dnx.png', 'public/anjo'],
]) {
  const base = sharp(src).trim({ threshold: 8 });
  const { info } = await base.clone().png().toBuffer({ resolveWithObject: true });
  await base.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(`${out}.webp`);
  console.log(`${out}.webp  ${info.width}x${info.height}`);
}

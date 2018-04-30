const fs = require('fs');
const { promisify } = require('util');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const pkg = require('../package.json');

const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);

// Bundle configs
const bundles = [
  {
    format: 'cjs',
    ext: '.js',
    plugins: [],
    babelPresets: [['env', { modules: false, targets: { node: 6 } }], 'stage-0'],
    babelPlugins: [],
  },
  {
    format: 'es',
    ext: '.es.js',
    plugins: [],
    babelPresets: ['stage-0'],
    babelPlugins: [],
  },
];

// Rollup input options
const inputOptions = config => ({
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: config.babelPresets,
      plugins: config.babelPlugins,
    }),
  ].concat(config.plugins),
});

// Rollup output options
const outputOptions = config => ({
  file: `dist/${config.filename || 'index'}${config.ext}`,
  format: config.format,
  sourceMap: !config.minify,
  moduleName: config.moduleName,
});

// Compile source code into a distributable format with Babel and Rollup
const generateBundle = async (config) => {
  try {
    const bundle = await rollup.rollup(inputOptions(config));
    await bundle.write(outputOptions(config));
  } catch (e) {
    console.error('Failed to generare bundle');
    console.error(e.stack);
  }
};

// Build the lib
const build = async () => {
  const start = Date.now();

  // Clean up the output directory
  try {
    await del(['dist/*']);
  } catch (e) {
    console.error('Failed to clean up build dir');
    console.error(e.stack);
  }

  // Generate the bundles
  const buildBundles = [];

  for (const bundleConfig of bundles) {
    buildBundles.push(await generateBundle(bundleConfig));
  }

  await Promise.all(buildBundles);

  // Copy package.json, README.md, and CHANGELOG.md
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.jest;

  try {
    await writeFile('dist/package.json', JSON.stringify(pkg, null, 2), 'utf-8');
    await copyFile('README.md', 'dist/README.md');
    await copyFile('CHANGELOG.md', 'dist/CHANGELOG.md');
  } catch (e) {
    console.error('Failed to copy package files');
    console.error(e.stack);
  }

  const ms = Date.now() - start;
  console.info(`Build complete in ${ms}ms.`);
};

build();

#!/usr/bin/env node

const { spawnSync } = require('child_process');

const ADMIN_BUILD_PATHS = [
  'admin/config.yml',
  'admin/index.html',
  'favicon.ico',
  'netlify.toml',
  'scripts/netlify-ignore-build.js',
  'scripts/prepare-netlify-admin.js',
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function hasAdminBuildChange(changedFiles) {
  return changedFiles.some((filePath) => ADMIN_BUILD_PATHS.includes(normalizePath(filePath)));
}

function printEnvironmentSummary() {
  const names = ['CACHED_COMMIT_REF', 'COMMIT_REF', 'BRANCH', 'HEAD'];
  const summary = names.map((name) => {
    const value = process.env[name];
    if (!value) return `${name}=missing`;
    if (name === 'CACHED_COMMIT_REF' || name === 'COMMIT_REF') {
      return `${name}=present:${value.slice(0, 12)}`;
    }
    return `${name}=present`;
  });

  console.log(`Netlify ignore env: ${summary.join(', ')}`);
}

function listChangedFiles(baseRef, headRef) {
  const result = spawnSync('git', ['diff', '--name-only', baseRef, headRef], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || 'git diff failed').trim());
  }

  return result.stdout
    .split(/\r?\n/)
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}

function listCommitFiles(headRef) {
  const result = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', '-m', headRef], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || 'git diff-tree failed').trim());
  }

  return result.stdout
    .split(/\r?\n/)
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}

function getCurrentHeadRef() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function getTestFiles(argv) {
  const index = argv.indexOf('--test-files');
  if (index === -1) return null;

  return argv
    .slice(index + 1)
    .flatMap((value) => value.split(','))
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}

function decide(changedFiles) {
  if (changedFiles.length === 0) {
    return {
      shouldIgnore: true,
      reason: 'No changed files found for Netlify admin artifact.',
    };
  }

  if (hasAdminBuildChange(changedFiles)) {
    return {
      shouldIgnore: false,
      reason: 'Netlify admin artifact input changed.',
    };
  }

  return {
    shouldIgnore: true,
    reason: 'Only files outside Netlify admin artifact inputs changed.',
  };
}

function main() {
  printEnvironmentSummary();

  const testFiles = getTestFiles(process.argv.slice(2));
  let changedFiles;

  if (testFiles) {
    changedFiles = testFiles;
    console.log('Netlify ignore mode: test');
  } else {
    const baseRef = process.env.CACHED_COMMIT_REF;
    const headRef = process.env.COMMIT_REF || process.env.HEAD || getCurrentHeadRef();

    if (!headRef) {
      console.log('Netlify build required: missing commit ref.');
      process.exit(1);
    }

    try {
      if (baseRef) {
        changedFiles = listChangedFiles(baseRef, headRef);
      } else {
        console.log('Netlify ignore fallback: CACHED_COMMIT_REF missing; checking current commit files.');
        changedFiles = listCommitFiles(headRef);
      }
    } catch (error) {
      console.log(`Netlify build required: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`Netlify ignore changed files: ${changedFiles.join(', ') || '(none)'}`);

  const decision = decide(changedFiles);
  if (decision.shouldIgnore) {
    console.log(`Netlify build skipped: ${decision.reason}`);
    process.exit(0);
  }

  console.log(`Netlify build required: ${decision.reason}`);
  process.exit(1);
}

main();

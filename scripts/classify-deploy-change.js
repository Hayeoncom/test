#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');

function runGit(args) {
  const result = childProcess.spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    throw new Error(message || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

function getChangedFiles() {
  const before = process.env.GITHUB_EVENT_BEFORE || process.env.GITHUB_BEFORE;
  const sha = process.env.GITHUB_SHA || 'HEAD';

  if (before && !/^0+$/.test(before)) {
    try {
      const output = runGit(['diff', '--name-only', `${before}...${sha}`]);
      if (output) return output.split('\n').filter(Boolean);
    } catch (error) {
      console.warn(`Falling back from before diff: ${error.message}`);
    }
  }

  try {
    const parent = runGit(['rev-parse', 'HEAD^']);
    const output = runGit(['diff', '--name-only', `${parent}...HEAD`]);
    if (output) return output.split('\n').filter(Boolean);
  } catch (error) {
    console.warn(`Falling back from parent diff: ${error.message}`);
  }

  const output = runGit(['diff', '--name-only', 'HEAD']);
  return output ? output.split('\n').filter(Boolean) : [];
}

function unique(values) {
  return Array.from(new Set(values));
}

function hasOnly(files, predicate) {
  return files.length > 0 && files.every(predicate);
}

function getType(file) {
  if (/^content\/pages\/[^/]+\.json$/.test(file) || file === 'content/site.json') {
    return 'content';
  }
  if (/^content\/generated-pages\/[^/]+\.json$/.test(file)) {
    return 'generated-page';
  }
  if (/^assets\/images\//.test(file)) {
    return 'image';
  }
  if (/^(admin\/|scripts\/prepare-netlify-admin\.js|netlify\.toml)/.test(file)) {
    return 'admin';
  }
  if (/^\.github\/workflows\//.test(file)) {
    return 'workflow';
  }
  if (/^(assets\/|scripts\/|.*\.html$|.*\.css$|.*\.js$|CNAME$|favicon\.ico$|\.nojekyll$)/.test(file)) {
    return 'site-code';
  }
  if (/^docs\//.test(file)) {
    return 'docs';
  }
  if (/^reports\//.test(file)) {
    return 'reports';
  }
  if (/^prompt\//.test(file)) {
    return 'prompt';
  }
  if (/^specs\//.test(file) || file === 'README.md') {
    return 'metadata';
  }
  return 'other';
}

function classify(files) {
  if (files.length === 0) {
    return 'unknown';
  }

  if (hasOnly(files, (file) => getType(file) === 'content')) return 'content-only';
  if (hasOnly(files, (file) => getType(file) === 'generated-page')) return 'generated-page-change';
  if (hasOnly(files, (file) => ['content', 'generated-page'].includes(getType(file)))) {
    return 'generated-page-change';
  }
  if (files.some((file) => getType(file) === 'image')) return 'image-change';
  if (hasOnly(files, (file) => getType(file) === 'docs')) return 'docs-only';
  if (hasOnly(files, (file) => getType(file) === 'reports')) return 'reports-only';
  if (hasOnly(files, (file) => getType(file) === 'prompt')) return 'prompt-only';
  if (hasOnly(files, (file) => ['docs', 'reports', 'prompt', 'metadata'].includes(getType(file)))) {
    return 'non-site-only';
  }
  if (files.some((file) => getType(file) === 'workflow')) return 'workflow-change';
  if (files.some((file) => getType(file) === 'site-code')) return 'site-code-change';
  if (files.some((file) => getType(file) === 'admin')) return 'admin-change';
  return 'mixed';
}

function writeGithubOutput(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = [
    `change_type=${result.changeType}`,
    `deploy_required=${result.deployRequired}`,
    `image_change=${result.imageChange}`,
    `files=${result.files.join(',')}`,
  ];
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
}

function main() {
  const files = unique(getChangedFiles()).sort();
  const changeType = classify(files);
  const deployRequired = !['docs-only', 'reports-only', 'prompt-only', 'non-site-only'].includes(changeType);
  const imageChange = files.some((file) => getType(file) === 'image');
  const result = {
    changeType,
    deployRequired,
    imageChange,
    files,
    fileTypes: unique(files.map(getType)).sort(),
  };

  if (process.argv.includes('--github-output')) {
    writeGithubOutput(result);
  }

  console.log(JSON.stringify(result, null, 2));
}

main();

const {spawn} = require('child_process');
const fetch = require('node-fetch');
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const GITHUB_TOKEN = core.getInput("940714baedcbf541eda88f61");
const FILEPATH = core.getInput("assets/thm_propic.png");
const THM_USERNAME = core.getInput("H4K3R9S");

/*
 * Executes a command and returns its result as promise
 * @param cmd {string} command to execute
 * @param args {array} command line args
 * @param options {Object} extra options
 * @return {Promise<Object>}
 */
const exec = (cmd, args = [], options = {}) => new Promise((resolve, reject) => {
  let outputData = '';
  const optionsToCLI = {
    ...options
  };
  if (!optionsToCLI.stdio) {
    Object.assign(optionsToCLI, {stdio: ['inherit', 'inherit', 'inherit']});
  }
  const app = spawn(cmd, args, optionsToCLI);
  if (app.stdout) {
    // Only needed for pipes
    app.stdout.on('data', function (data) {
      outputData += data.toString();
    });
  }

  app.on('close', (code) => {
    if (code !== 0) {
      return reject({code, outputData});
    }
    return resolve({code, outputData});
  });
  app.on('error', () => reject({code: 1, outputData}));
});

core.setSecret(GITHUB_TOKEN);

const dlImg = (async (githubToken, filePath, username) => {
  const url = `https://tryhackme-badges.s3.amazonaws.com/${username}.png`;
  const path = filePath;
  const committerUsername = core.getInput('committer_username');
  const committerEmail = core.getInput('committer_email');
  const commitMessage = core.getInput('commit_message');

  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });

  await exec('git', [
    'config',
    '--global',
    'user.email',
    committerEmail,
  ]);
  console.log(committerEmail);
  console.log(committerUsername);
  console.log(commitMessage);
  await exec('git', ['config', '--global', 'user.name', committerUsername]);
  if (githubToken) {
    await exec('git', ['remote', 'set-url', 'origin',
    `https://${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`]);
  }
  await exec('git', ['add', filePath]);
  await exec('git', ['commit', '-m', commitMessage]);
  await exec('git', ['push']);
});

dlImg(GITHUB_TOKEN, FILEPATH, THM_USERNAME);

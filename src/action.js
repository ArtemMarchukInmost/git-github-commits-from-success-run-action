const {Octokit} = require("@octokit/core");
const core = require('@actions/core');
const fs = require('fs');

const WORKFLOW_ID = core.getInput('WORKFLOW_ID');
const BRANCH = core.getInput('BRANCH');
const OWNER = core.getInput('OWNER');
const REPO = core.getInput('REPO');
const AUTH_TOKEN = core.getInput('AUTH_TOKEN');
const OUTPUT_PATH = core.getInput('OUTPUT_PATH');

const octokit = new Octokit({auth: AUTH_TOKEN});

async function getLastSuccessRunCommit() {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
            owner: OWNER,
            repo: REPO,
            branch: BRANCH,
            workflow_id: WORKFLOW_ID,
            per_page: 1,
            status: 'success',
        });

        const successRun = response.data.workflow_runs[0];

        return successRun ? successRun.head_sha : undefined;
    } catch (e) {
        core.setFailed(`Failed To Get Last Success Workflow Run, ${e}`);
    }
}

async function getLastBranchCommit() {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
            owner: OWNER,
            repo: REPO,
            branch: BRANCH
        });

        return response.data.commit.sha;
    } catch (e) {
        core.setFailed(`Failed To Get Last Branch Commit, ${e}`);
    }
}

async function getFirstBranchCommit() {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: OWNER,
            repo: REPO,
            branch: BRANCH,
            per_page: 1
        });

        const lastPage = response.headers.link.split(',')[1].split('&page=')[1].split('>')[0];

        const responseResult = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: OWNER,
            repo: REPO,
            branch: BRANCH,
            per_page: 1,
            page: lastPage,
        });

        return responseResult.data[0].sha;
    } catch (e) {
        core.setFailed(`Failed To Get First Branch Commit, ${e}`);
    }
}

async function compareTwoCommits(a, b) {
    try {
        if (a === b) {
            return 1;
        }

        const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
            owner: OWNER,
            repo: REPO,
            per_page: 100,
            basehead: `${a}...${b}`
        });

        return  response.data.ahead_by;
    } catch (e) {
        core.setFailed(`Failed To Compare Two Commit, ${e}`);
    }
}

async function getCommitsWithMessages(sha, count, messages, page) {
    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: OWNER,
            repo: REPO,
            sha,
            per_page: count,
            page,
        });

        const pageMessages = response.data.map(commit => ({
            message: commit.commit.message,
            sha: commit.sha,
        }));

        messages.push(...pageMessages);
        count -= pageMessages.length;

        if (count <= 0) {
            return messages;
        } else {
            return getCommitsWithMessages(sha, count, messages, page++)
        }
    } catch (e) {
        core.setFailed(`Failed To Get Commit, ${e}`);
    }
}

function writeOutputFile(commits) {
    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
            commits,
        }));
    } catch (e) {
        core.setFailed(`Failed To Write Output File, ${e}`);
    }
}

async function getCommitsFromLastSuccessRun() {
    let beginCommit = await getLastSuccessRunCommit();
    const endCommit = await getLastBranchCommit();

    if (!beginCommit) {
        console.log('No Success Runs Were Found, I Will Use First Commit From This Branch');
        beginCommit = await getFirstBranchCommit();
    }

    const aheadBy = await compareTwoCommits(beginCommit, endCommit);

    const commits = await getCommitsWithMessages(endCommit, aheadBy, [], 1);

    writeOutputFile(commits);

    console.log('SUCCESS');
    console.log(commits);
}

getCommitsFromLastSuccessRun();

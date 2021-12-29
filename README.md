# git-github-commits-from-success-run-action

All your commits from last success workflow

## Usage Example

```yaml
  - uses: ArtemMarchukInmost/git-github-commits-from-success-run-action@main
    with:
      WORKFLOW_ID: 16857291
      BRANCH: main
      OWNER: ArtemMarchukInmost
      REPO: git-github-commits-from-success-run-action
      AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      OUTPUT_PATH: ${{ github.workspace }}/output.json
```

## Inputs

#### AUTH_TOKEN

Required

Your GitHub Token

#### WORKFLOW_ID

Required

Your Workflow ID (GitHub CLI: ```gh workflow list```)

#### BRANCH

Required

Your Branch Name (dev, master, main)

#### OWNER

Required

Repo Owner

#### REPO

Required

Repo name

### OUTPUT_PATH

Required

Path where to store output JSON 

Output Example:

```json
{
  "commits": [
    {
      "message": "action",
      "sha": "1bed02eac8387b0a8c51e66adcc43c583de490ab"
    }
  ]
}
```

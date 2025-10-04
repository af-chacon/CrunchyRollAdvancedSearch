# Branch Protection Setup

This document explains how to configure branch protection rules for the `main` branch.

## Why Branch Protection?

Branch protection ensures:
- All changes are reviewed via pull requests
- Commit history stays clean with squash merges
- No accidental direct commits to main
- Contributors work from forks (safer workflow)

## Setup Instructions

### 1. Access Branch Protection Settings

1. Go to your repository on GitHub
2. Click **Settings** (gear icon)
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule**

### 2. Configure Protection Rule

#### Branch Name Pattern
```
main
```

#### Settings to Enable

**Require a pull request before merging** ✅
- Enable this checkbox
- **Required approvals**: 1 (or more if you prefer)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if you add a CODEOWNERS file)

**Require status checks to pass before merging** (Optional)
- Enable if you add CI/CD tests
- Select required checks when available

**Require conversation resolution before merging** ✅
- Enable this to ensure all review comments are addressed

**Require signed commits** (Optional)
- Enable for extra security if desired

**Require linear history** ✅
- Enable this to prevent merge commits
- Works with squash merge requirement

**Require deployments to succeed before merging** (Optional)
- Enable if you set up deployment previews

**Lock branch** ❌
- Leave disabled (allows PRs)

**Do not allow bypassing the above settings** ✅
- Enable to prevent admins from bypassing rules
- Or keep disabled if you want emergency access

**Restrict who can push to matching branches** ✅
- Enable this
- Do not add any users/teams
- This forces all changes through PRs from forks

**Allow force pushes** ❌
- Leave disabled

**Allow deletions** ❌
- Leave disabled

### 3. Repository Settings

Also configure in **Settings → General**:

**Pull Requests**
- ✅ **Allow squash merging** (keep enabled)
- ❌ **Allow merge commits** (disable)
- ❌ **Allow rebase merging** (disable)
- ✅ **Always suggest updating pull request branches**
- ✅ **Automatically delete head branches**

**Default pull request title and commit message**
- Select: **Pull request title**

This ensures only squash merges are possible.

### 4. Verify Setup

Test the configuration:

1. Try to push directly to main (should fail)
   ```bash
   git push origin main
   # Should see: error: protected branch
   ```

2. Create a PR from a fork (should work)
   - Fork → Branch → Commit → Push → PR

3. Try to merge with "Create a merge commit" (should not be an option)
   - Only "Squash and merge" should be available

## For Repository Maintainers

### Reviewing Pull Requests

1. **Check the changes**
   - Review code quality
   - Test functionality
   - Check for breaking changes
   - Verify documentation updates

2. **Request changes if needed**
   - Be specific and constructive
   - Explain why changes are needed
   - Suggest solutions

3. **Approve and merge**
   - Once satisfied, approve the PR
   - Click "Squash and merge"
   - Edit commit message if needed
   - Confirm merge

### Managing Contributors

**Code Owners** (Optional)
Create `.github/CODEOWNERS`:
```
# Global owners
* @af-chacon

# Specific areas
/frontend/ @frontend-team
/scripts/ @automation-team
*.py @python-team
```

**Invite Collaborators** (Optional)
- Settings → Collaborators
- Add trusted contributors with "Write" access
- They can still only merge via PR

## Troubleshooting

**Problem**: Can't push to main
- **Solution**: This is expected! Create a PR instead

**Problem**: Can't create PR from branch
- **Solution**: PRs must come from forks, not branches

**Problem**: Merge button doesn't appear
- **Solution**: Check if all required checks pass

**Problem**: Need emergency access
- **Solution**: Temporarily disable protection rules (requires admin)

## For Contributors

You don't need to worry about these settings! Just:

1. Fork the repository
2. Create a branch in your fork
3. Make changes
4. Push to your fork
5. Open a PR to the main repository

The branch protection rules ensure quality and consistency automatically.

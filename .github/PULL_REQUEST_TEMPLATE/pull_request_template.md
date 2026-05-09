<<<<<<< HEAD
name: Pull Request

on:
  pull_request:
    types: [opened, synchronize]

body:
  - type: markdown
    attributes:
      value: |
        ## Description
        Please describe your changes in detail.

  - type: dropdown
    id: type
    attributes:
      label: Change Type
      options:
        - Bug Fix
        - New Feature
        - Refactoring
        - Documentation
        - Performance Improvement
        - Security Fix
        - Other
    validations:
      required: true

  - type: textarea
    id: test
    attributes:
      label: Testing Done
      placeholder: |
        - [ ] Tested locally
        - [ ] Added unit tests
        - [ ] Tested in staging

  - type: textarea
    id: breaking
    attributes:
      label: Breaking Changes
      placeholder: List any breaking changes (or write "None")

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots (if applicable)
      placeholder: Add screenshots of changes here

  - type: textarea
    id: related
    attributes:
      label: Related Issues
      placeholder: "Fixes #123, Related to #456"
=======
## Pull Request

### Summary

Briefly describe what this PR does and why it's needed.

### Type of Change

Mark the relevant option with an `x`:

- [ ] **Bug Fix** — Non-breaking change that fixes an issue
- [ ] **New Feature** — Non-breaking change that adds functionality
- [ ] **Breaking Change** — Fix or feature that breaks existing functionality
- [ ] **Refactor** — Code changes that neither fix a bug nor add a feature
- [ ] **Documentation** — Documentation-only changes
- [ ] **Performance** — Changes that improve performance
- [ ] **Security** — Security-related fixes or improvements

### Changes Made

Describe the specific changes made in this PR:

1.
2.
3.

### Testing

Describe how you tested these changes:

- [ ] Tested locally with `npm run dev` / `uvicorn main:app --reload`
- [ ] Added/updated unit tests
- [ ] Verified no existing tests are broken
- [ ] Tested edge cases (empty inputs, error states, etc.)

### Screenshots

Add screenshots if the PR affects the UI:

### Related Issues

Fixes #
Related to #

### Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-review of the code has been completed
- [ ] Comments have been added for complex logic
- [ ] Documentation has been updated (if applicable)
- [ ] No new warnings are introduced
- [ ] All new dependencies are necessary
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

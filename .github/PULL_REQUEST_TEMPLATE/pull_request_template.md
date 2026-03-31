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

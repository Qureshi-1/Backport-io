name: Issue Forms

on:
  issues:
    types: [opened, edited]

body:
  - type: markdown
    attributes:
      value: |
        ## Issue Description
        Please describe the issue in detail.

  - type: dropdown
    id: type
    attributes:
      label: Issue Type
      options:
        - Bug Report
        - Feature Request
        - Documentation
        - Question
        - Other
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      placeholder: Tell us what should happen

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      placeholder: Tell us what happens instead

  - type: dropdown
    id: os
    attributes:
      label: Operating System
      options:
        - Windows
        - macOS
        - Linux
        - Termux
        - Other
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: Backport Version
      placeholder: e.g., 1.2.0

  - type: textarea
    id: logs
    attributes:
      label: Relevant Logs
      placeholder: |
        ```
        Paste your logs here
        ```

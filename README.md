# genereleaselog

🎨 Generate the Release log in accordance with the
GitHub [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Quick Start

Generate a release changelog:

```sh
npx genereleaselog --token=GITHUB_TOKEN
```

**Arguments:**

- `--from`: Start commit reference. When not provided, **latest git tag** will be used as default.
- `--to`: End commit reference. When not provided, **latest commit in HEAD** will be used as default.
- `--assets`: Files or glob patterns to upload. Releases with assets are created as drafts, verified after upload, and then published.
- `--draft`: Leave the release as a draft after uploading and verifying its assets.

When `--assets` is provided, the release is published only after every asset upload succeeds and the uploaded files have been verified through the GitHub API. If any step fails, the command exits with an error and the release remains a draft.

### Example Workflow: `.github/workflows/release.yml`

```yml
name: Release

permissions:
  contents: write

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - run: npx genereleaselog
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

# 🤝 How to Contribute

We welcome contributions of all kinds! Whether it's fixing a typo in the documentation, improving the code, or
suggesting new features.

## Contribution Process

* Fork this repository
* Create a new branch (git checkout -b feature/your-feature)
* Commit your changes (git commit -m 'feat: add some feature')
* Push to the branch (git push origin feature/your-feature)
* Open a Pull Request

## License

Made with 💛

Published under [MIT License](./LICENSE).

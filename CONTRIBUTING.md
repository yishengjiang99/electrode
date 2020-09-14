# Contributing

PRs and issues are always welcome! We appreciate your interest in Electrode and offer to help.

There are [few guidelines](#contributing-guidelines) that we request contributors to follow so that we can keep things well maintained.

## Getting Started

This repo uses [Lerna] as a top level setup and [fyn] to manage Node Modules.

### Setup

Install these CLI tools globally: [xclap-cli] and [fyn]

```bash
$ npm install -g xclap-cli @xarc/run-cli fyn
$ fyn -V
0.2.41
```

> Make sure `fyn`'s version is at least `0.2.41`

Fork and clone the repo at <https://github.com/electrode-io/electrode.git> and bootstrap all the packages.

```bash
$ git clone https://github.com/<your-github-id>/electrode.git
$ cd electrode
$ fyn # install node_modules
$ fun bootstrap # run npm script bootstrap
```

### Quick Test

Because many of our modules depend on each other, to make local development easier, we use [fyn] to install packages when doing development.

#### Try a sample

Now you can go to the `samples` folder and try the `universal-react-node` sample app, develop and test your changes over there.

```bash
$ cd samples/poc-subapp
$ fyn
$ fun dev
```

After running above, you should see a similar text as `Hapi.js server running at http://localhost:3000` in command line.

And when you open the browser at `http://localhost:3000`, you should see a large Electrode icon with a few demonstration components.

### **Important** Notes

**Bootstrapping**

- You must bootstrap the entire repo at the top dir at least once with `clap bootstrap`
- Every time you pull down new changes or switch a branch, you should run bootstrap again.
- Every time you make changes to a package that another depends on, you must bootstrap them again.
- You can bootstrap a single package only: ie: `npx fynpo bootstrap --only @xarc/app-dev`
  - This will ensure all its locally dependent packages are bootstrapped also.

#### Test with `@xarc/create-app`

You can quickly use the `xarc-create-app` package to create an app for testing.

```bash
$ clap packages/xarc-create-app
$ node src test-app
$ cd test-app
$ fyn
$ fun dev
```

This sample app is using [fyn] to directly linked to the modules under the `packages` directory. Changes made there will be reflected in the app immediately. This is the typical testing and developing flow we use.

## Contributing Guidelines

### Submitting Pull Request

We love PRs and appreciate any help you can offer. Please follow the guidelines on styling and commit messages here.

#### Styling

We've now switched to use [prettier] to format all our code.

Our [prettier] settings are: `--print-width 100`

> If you are making changes to a file that has not been updated yet, please commit the format first before making your changes.

#### PR and Commit messages

Since we use independent lerna mode, to help keep the changelog clear, please format all your commit message with the following guideline:

`[<semver>][feat|bug|chore] <message>`

- `<semver>` can be:
  - `major` - `maj` or `major`
  - `minor` - `min` or `minor`
  - `patch` - `pat` or `patch`
- Only include `[feat|bug|chore]` if it's applicable.
- Please format your PR's title with the same format.

> **_Please do everything you can to keep commits for a PR to a single package in `packages`._**

A sample commit and PR message should look like:

```text
[minor][feat] implement SSR support for Inferno
```

> Note: Branching is recommended on Publish commits only so it's possible to rely on lerna to publish from that branch.

### Filing Issues

We love to hear about your experience using Electrode and bug reports. Electrode has many features and it's hard for us to test everything under all scenarios and setup, so your help is very important to us.

When you submit a bug report, please include the following information:

- NodeJS/npm versions by doing `nodev -v` and `npm -v`
- Your OS and version
- Electrode package versions
- Any errors output
- If possible, sample code and steps on how to reproduce the bug

## Updating Docs

This repo has a [gitbook] documentation under `docs`. To review the docs as a gitbook locally:

- Install [gitbook-cli] and the plugins for docs.
- Note that gitbook (3.2.3) uses npm (3.9.2) to manage its own plugins and that may conflict with [fyn] installed `node_modules`.
  - which is why for the top level dir of our lerna repo, we use `npm install` directly.

```bash
$ cd electrode
$ npm install gitbook-cli -g
$ gitbook install
```

- Now serve the book locally

```bash
$ gitbook serve --no-watch --no-live
```

And open your browser to `http://localhost:4000` to view the docs.

Here is the documentation on a [gitbook] structure: <https://toolchain.gitbook.com/structure.html>

> Without the `--no-watch --no-live` options it becomes unusably slow on my machine.\
> If things don't work, then remove `~/.gitbook` and run `gitbook install` or `gitbook fetch` to let it reset itself.

## Releasing

The versioning of modules in the this repo are all automatically controlled by the commit message.

It's important that commits are isolated for the package they affected only and contains the version tags `[major]`, `[minor]`, or `[patch]`. `[patch]` is the default if tag is not found in commit message.

To release, there are three steps:

1. Use `clap update-changelog` to detect packages that changed and their version bumps.
1. Verify and check the file `CHANGELOG.md`, add a summary of key changes under the date.
1. Amend the commit for `CHANGELOG.md` with summary changes.
1. Run `npx fynpo prepare --no-tag` to prepare packages for release.
1. Run `git tag -a rel-v<#>-<date>` where `<#>` is the major archetype version, and `<date>` as `MMDDYYYY`.
1. Publish the packages that `fynpo prepare` shown that has updates.
1. Push release commits.

[gitbook-cli]: https://www.npmjs.com/package/gitbook-cli
[prettier]: https://www.npmjs.com/package/prettier
[lerna]: https://lernajs.io/
[gitbook]: https://www.gitbook.com
[xclap-cli]: https://www.npmjs.com/package/xclap-cli
[fyn]: https://www.npmjs.com/package/fyn

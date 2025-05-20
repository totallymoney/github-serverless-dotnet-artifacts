# github serverless dotnet artifacts

Publish and deploy serverless dotnet projects using github managed artifacts.

Serverless packaging is performed [correctly](https://blair55.github.io/blog/serverless-package-done-right/).

## Requirements

* `yarn`, `gh` & `dotnet` are available on the command line
* `Amazon.Lambda.Tools` dotnet tool is installed in the target dotnet repo:

```bash
$ dotnet new tool-manifest
$ dotnet tool install Amazon.Lambda.Tools
```

## Usage

1. Install

```bash
$ yarn add -D @totallymoney/github-serverless-dotnet-artifacts
```

2. Specify this package location in your `serverless.yml`

```yaml
package:
  artifact: package.zip
```

3. Add a `publish` step to your CI pipeline to create a github release

```bash
$ yarn run gsda-publish $VERSION [ -p path/to/project ]
```

- `$VERSION` is the github release name in [semver](http://semver.org) format
- `-p` is optional with a default value of `./src`

4. Use the `deploy` command to update an enviroment

```bash
$ yarn run gsda-deploy $VERSION $ENVIRONMENT
```

- `$VERSION` is the github release to deploy
- `$ENVIRONMENT` is the target environment (aka serverless 'stage')

5. Add a helper script to your `package.json` and use `pick` for interactive deployments!

```json
"scripts": {
  "pick": "gsda-pick -e stage -e prod -c 5"
}
```

```bash
$ yarn pick
```
* `-e` (multiple) are preset environments for `pick`
* `-c` is the version list count for `pick`
* both `-e` and `-c` have sensible defaults and can be overridden when `pick` is called


## Development

Make sure you belong to the [totallymoney](https://www.npmjs.com/settings/totallymoney/packages) npm organization, or use the "NPM Service Account" credentials found in keeper when the publish step asks to auth. Then make changes to the source code and publish. Enter the new version number as prompted. A git push command will run automatically after publishing.

```bash
$ git commit -am "Improve logging"
$ yarn publish --access public
```


## Migrating from 3.x.x to 4.x.x

- [github cli](https://cli.github.com/) is required on your machine.

  ```bash
  $ brew install gh
  # start interactive setup
  $ gh auth login
  ```

- The `deploy` & `publish` npm scripts are now obselete.

  Even in 3.x.x, these commands only existed as a _level of indirection_ to centralize input that could be called from more than one place and be burdensome to type. These commands are now less of a burden because the `gh` cli automatically recognises the repo it is operating on. We no longer need to "pin" the repo name with `deploy` & `publish` indirection commands, and can instead go straight to `gsda-deploy|publish`. We should, however, favour `gsda-pick` to manually deploy from the command line over `gsda-deploy`. `gsda-pick` now uses `gsda-deploy` internally, and no longer expects `deploy` to exist.

  The positional arguments of `gsda-deploy` remain the same: version, then target environment. So if `deploy` is called by CI tooling, the only change required is to use `gsda-deploy` instead.

  The removal of `publish` also avoids any confusion caused by "squatting" on the existing (npm|yarn) [`publish`](https://classic.yarnpkg.com/lang/en/docs/cli/publish/) command.

- The project path of the `gsda-publish` command is provided via the optional `-p` flag.

  If not specified, the project path defaults to `./src` which is the case for most projects. The version argument is still the first positional argument expected by `gsda-publish`. The command should be called directly from CI tooling, and called directly from the command line if ever needed outside of a CI context.
  
- The commit hash positional argument to the `gsda-publish` command is obselete.

  Again, `gh` understands the context and will create a release from the current state of the repo, which will be checked out at the commit we wish to tag.

- If building with CircleCI the [github-cli orb](https://circleci.com/developer/orbs/orb/circleci/github-cli) is required.

  package.json
  ```diff
  "devDependencies": {
  - "@totallymoney/github-serverless-dotnet-artifacts": "^3.2.0",
  + "@totallymoney/github-serverless-dotnet-artifacts": "^4.0.0",
  },
  "scripts": {
  - "publish": "gsda-publish org/repo proj/path",
  - "deploy": "gsda-deploy org/repo",
  }
  ```

  .github/workflows/build.yml
  ```diff
    - if: github.ref == 'refs/heads/main'
  -   run: yarn run publish $VERSION $GITHUB_SHA
  +   run: yarn run gsda-publish $VERSION -p proj/path
      env:
  -     GITHUB_OAUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  +     GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        VERSION: 0.0.${{ github.run_number }}
  ```

  .circleci/config.yml
  ```diff
  + orbs:
  +   github-cli: circleci/github-cli@2.3.0

    - when:
        condition:
          equal: [ << pipeline.git.branch >>, main ]
        steps:
  +       - github-cli/setup:
  +           token: GITHUB_OAUTH_TOKEN
          - run:
  -           command: yarn run publish $VERSION $CIRCLE_SHA1
  +           command: yarn run gsda-publish $VERSION -p proj/path
           environment:
             VERSION: 0.0.<< pipeline.number >>
  ```

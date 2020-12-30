# github serverless dotnet artifacts

Publish and deploy serverless dotnet projects using github managed artifacts.

Serverless packaging is performed [correctly](https://blair55.github.io/blog/serverless-package-done-right/).

## Requirements

Make sure your target environment has cli tools `jq`, `yarn`, `curl` & `dotnet` installed. Also, make sure the `Amazon.Lambda.Tools` nuget package installed globally.

```bash
$ dotnet tool install -g Amazon.Lambda.Tools
```

## Usage

1. Install

```bash
$ yarn add -D @totallymoney/github-serverless-dotnet-artifacts
```

2. Add these scripts to your `package.json`

```json
"scripts": {
  "publish": "gsda-publish <org/repo> <project_path>",
  "deploy": "gsda-deploy <org/repo>",
  "pick": "gsda-pick"
}
```

* `<org/repo>` could be `mediaingenuity/myrepo` or `totallymoney/repo.name`
* `<project_path>` could be `src` or `path/to/project.fsroj`

3. Specify this package location in your `serverless.yml`

```yaml
package:
  artifact: package.zip
```

4. Add a `publish` step to your CI pipeline to create a github release

```bash
$ yarn run publish $VERSION $GITHASH
```

- `$VERSION` is the github release name in [semver](http://semver.org) format
- `$GITHASH` is the commit that triggered the build and will be tagged

5. Use the `deploy` command to update an enviroment

```bash
$ yarn run deploy $VERSION $ENVIRONMENT
```

- `$VERSION` is the github release to deploy
- `$ENVIRONMENT` is the target environment (aka serverless `stage`)

6. Use `pick` for interactive deployments!

```bash
$ yarn pick
```

## Development

Make sure you belong to the [totallymoney](https://www.npmjs.com/settings/totallymoney/packages) npm organization. Then make changes to the source code and publish. Enter the new version number as prompted. A git push command will run automatically after publishing.

```bash
$ git commit -am "Improve logging"
$ yarn publish --access public
```

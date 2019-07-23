# github serverless dotnet artifacts

Publish and deploy serverless dotnet projects using github managed artifacts.

## Usage

1. Install

```bash
$ npm i --save-dev @totallymoney/github-serverless-dotnet-artifacts
```

2. Add scripts to your `package.json`

```json
"scripts": {
  "publish": "gsda-publish <org/repo>",
  "deploy": "gsda-deploy <org/repo>"
}
```

3. Add a `publish` step to your CI pipeline to create a github release

```bash
$ yarn run publish $VERSION $GITHASH
```

- `$VERSION` is the github release name in [semver](http://semver.org) format
- `$GITHASH` is the commit that triggered the build and will be tagged

4. Use the `deploy` step to update an enviroment

```bash
$ yarn run deploy $VERSION $ENVIRONMENT
```

- `$VERSION` is the github release to deploy
- `$ENVIRONMENT` is the target environment (aka serverless `stage`)

## Development

Make sure you belong to the [totallymoney](https://www.npmjs.com/settings/totallymoney/packages) npm organization. Then make changes to the source code and publish. Enter the new version number as prompted and push the resulting commit.

```bash
$ [npm|yarn] publish --access public
```
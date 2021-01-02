import aws from 'aws-sdk';
import git from 'nodegit';

export default async (envs, count, sls) => {

    const lambda = new aws.Lambda({ region: sls.provider.region });
    const repo = await git.Repository.open('./');
    await repo.fetch('origin', {
        callbacks: { credentials: (_, userName) => git.Cred.sshKeyFromAgent(userName) }
    });

    const deploys = await Promise.all(envs.map(async (env) => {
        const funcName = Object.keys(sls.functions)[0];
        const name = `${sls.service}-${env}-${funcName}`;
        const version = await getVersion(lambda, name);
        return { version, env };
    })).then(envs => envs.filter((e) => e.version));

    return await git.Tag.list(repo)
        .then(async tags => await Promise.all(tags.map(tag => getTagDetails(repo, tag))))
        .then(tags => tags.sort((a, b) => b.date - a.date).slice(0, count))
        .then(tags => tags.map(tag => ({ ...tag, envs: getVersionEnvs(deploys, tag.version) })))
        .catch(console.error);
}

const getVersion = (lambda, name) => lambda
    .getFunctionConfiguration({ FunctionName: name })
    .promise()
    .then(config => config.Environment.Variables.VERSION)
    .catch(() => undefined);

const getVersionEnvs = (deploys, version) => deploys
    .filter(deploy => deploy.version == version)
    .map(deploy => deploy.env);

const getTagDetails = (repo, tag) => git.Reference.lookup(repo, `refs/tags/${tag}`)
    .then(ref => git.Commit.lookup(repo, ref.target()))
    .then(commit => ({
        version: tag,
        msg: commit.summary(),
        author: commit.author().name(),
        date: new Date(commit.date()),
    }));

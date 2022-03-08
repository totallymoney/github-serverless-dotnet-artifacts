import async from 'async'
import notifier from 'node-notifier'
import { deploy } from './strategies/index.js'

export default ({ version, environments, strategy }, serviceName) =>
  async.series(
    environments.map(e => cb => {
      deploy[strategy](e, version)
        .then(_ =>
          notifier.notify({
            title: serviceName,
            message: `${version} deployed to ${e}`,
          })
        )
        .then(_ => cb(null, e))
    })
  )

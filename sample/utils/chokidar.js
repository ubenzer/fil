import Rx from "rxjs/Rx"
import chokidar from "chokidar"

const startWatching = ({events, args}) =>
  Rx.Observable.create((subscriber) => {
    const watcher = chokidar.watch.apply(null, args)

    events.forEach((e) => {
      watcher.on(e, () => {
        subscriber.next()
      })
    })

    return () => watcher.close()
  })
  .publish()
  .refCount()

const chokidar$ = (...chokidarArgs) =>
  startWatching({args: chokidarArgs, events: ["all"]})

const chokidarAddRemoveFile$ = (...chokidarArgs) =>
  startWatching({args: chokidarArgs, events: ["add", "unlink"]})

export {chokidar$, chokidarAddRemoveFile$}

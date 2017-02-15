import Rx from "rxjs/Rx"
import chokidar from "chokidar"

const chokidar$ = (...chokidarArgs) =>
  Rx.Observable.create((subscriber) => {
    const watcher = chokidar.watch.apply(null, chokidarArgs)

    watcher.on("all", () => {
      subscriber.next()
    })

    return () => {
      watcher.close()
    }
  })
  .publish()
  .refCount()

export {chokidar$}

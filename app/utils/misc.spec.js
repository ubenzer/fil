const {toObservable, translateError} = require('./misc')
const {it} = require('jasmine-promise-wrapper')
const Rx = require('rxjs')

describe('translateError', () => {
  it('returns the same error back', () => {
    const error = new Error('error')
    const result = translateError(error)
    expect(result).toEqual(error)
  })
})

describe('toObservable', () => {
  it('returns an empty observable if there is nothing to convert', () => {
    const noopFunc = () => null
    spyOn(Rx, 'empty').and.returnValue(noopFunc)
    const out = toObservable()
    expect(out).toEqual(noopFunc)
  })
  it('creates a observable that emits when notifyFn called', () => {
    let notifyFnOut = null
    let subscriptionFireCount = 0
    const out = toObservable(({notifyFn}) => {
      notifyFnOut = notifyFn
    })
    out.subscribe(() => {
      subscriptionFireCount++
    })
    expect(subscriptionFireCount).toEqual(0)
    notifyFnOut()
    expect(subscriptionFireCount).toEqual(1)
  })
  it('invokes unsubscribe function when observable is unsubscribed', () => {
    let unsubscriptionFireCount = 0
    const out = toObservable(() => ({
      unsubscribe: () => {
        unsubscriptionFireCount++
      }
    }))

    const subscription = out.subscribe(() => null)
    expect(unsubscriptionFireCount).toEqual(0)
    subscription.unsubscribe()
    expect(unsubscriptionFireCount).toEqual(1)
  })
})

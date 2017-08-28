import {ReactiveCache} from '../app/reactiveCache'
import {it} from 'jasmine-promise-wrapper'

let cache = null

beforeEach(() => {
  cache = new ReactiveCache()
})

describe('ReactiveCache', () => {
  describe('adding a new item', () => {
    it('offers a way to add a new item', async () => {
      const id = 'id'
      const valueFn = jasmine.createSpy('valueFn', async () => 'value').and.callThrough()
      const watchFn = jasmine.createSpy('watchFn')
      const notifyFn = jasmine.createSpy('notifyFn')

      const value = await cache.calculate({id, notifyFn, valueFn, watchFn})

      expect(value).toEqual('value')
      expect(cache._cache[id]).toEqual(jasmine.any(Object)) // eslint-disable-line no-underscore-dangle
      expect(valueFn).toHaveBeenCalledTimes(1)
      expect(watchFn).toHaveBeenCalledTimes(1)
      expect(notifyFn).toHaveBeenCalledTimes(0)
    })

    it("doesn't recalculate value, if it is already in the cache", async () => {
      const id = 'id'
      const valueFn = jasmine.createSpy('valueFn', async () => 'value').and.callThrough()
      const watchFn = jasmine.createSpy('watchFn')
      const notifyFn = jasmine.createSpy('notifyFn')

      const value = await cache.calculate({id, notifyFn, valueFn, watchFn})
      expect(value).toEqual('value')
      expect(valueFn).toHaveBeenCalledTimes(1)
      const value2 = await cache.calculate({id, notifyFn, valueFn, watchFn})
      expect(value2).toEqual('value')
      expect(valueFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('change detection and notification', () => {
    it('invokes unsubscriptionFn and notifyFn on value change and clears cache', async () => {
      let valueNotifyFn = null
      const id = 'id'
      const valueUnsubFn = jasmine.createSpy('valueUnsubFn')
      const valueFn = jasmine.createSpy('valueFn', async () => 'value').and.callThrough()
      const watchFn = jasmine.createSpy('watchFn', ({notifyFn}) => {
        valueNotifyFn = notifyFn
        return {unsubscribe: valueUnsubFn}
      }).and.callThrough()
      const notifyFn = jasmine.createSpy('notifyFn')

      const value = await cache.calculate({id, notifyFn, valueFn, watchFn})
      expect(value).toEqual('value')
      expect(valueNotifyFn).toEqual(jasmine.any(Function))
      expect(notifyFn).toHaveBeenCalledTimes(0)
      expect(cache._cache[id]).toEqual(jasmine.any(Object)) // eslint-disable-line no-underscore-dangle
      expect(valueUnsubFn).toHaveBeenCalledTimes(0)

      // notify cache that value is changed
      valueNotifyFn()

      // check if we take proper actions
      expect(notifyFn).toHaveBeenCalledTimes(1)
      expect(notifyFn).toHaveBeenCalledWith({oldValue: 'value'})
      expect(cache._cache[id]).not.toEqual(jasmine.any(Object)) // eslint-disable-line no-underscore-dangle
      expect(valueUnsubFn).toHaveBeenCalledTimes(1)
    })

    it('invokes notifyFn and clears cache on value change if unsubscriptionFn is not provided', async () => {
      let valueNotifyFn = null
      const id = 'id'
      const valueFn = jasmine.createSpy('valueFn', async () => 'value').and.callThrough()
      const watchFn = jasmine.createSpy('watchFn', ({notifyFn}) => {
        valueNotifyFn = notifyFn
      }).and.callThrough()
      const notifyFn = jasmine.createSpy('notifyFn')

      await cache.calculate({id, notifyFn, valueFn, watchFn})
      expect(notifyFn).toHaveBeenCalledTimes(0)

      // notify cache that value is changed
      valueNotifyFn()

      // check if we take proper actions
      expect(notifyFn).toHaveBeenCalledTimes(1)
      expect(notifyFn).toHaveBeenCalledWith({oldValue: 'value'})
      expect(cache._cache[id]).not.toEqual(jasmine.any(Object)) // eslint-disable-line no-underscore-dangle
    })

    it('ignores second and later calls to notifyFn', async () => {
      let valueNotifyFn = null
      const id = 'id'
      const valueUnsubFn = jasmine.createSpy('valueUnsubFn')
      const valueFn = jasmine.createSpy('valueFn', async () => 'value').and.callThrough()
      const watchFn = jasmine.createSpy('watchFn', ({notifyFn}) => {
        valueNotifyFn = notifyFn
        return {unsubscribe: valueUnsubFn}
      }).and.callThrough()
      const notifyFn = jasmine.createSpy('notifyFn')

      await cache.calculate({id, notifyFn, valueFn, watchFn})
      expect(notifyFn).toHaveBeenCalledTimes(0)
      expect(valueUnsubFn).toHaveBeenCalledTimes(0)

      // notify cache that value is changed
      valueNotifyFn()

      // check if we take proper actions
      expect(notifyFn).toHaveBeenCalledTimes(1)
      expect(valueUnsubFn).toHaveBeenCalledTimes(1)

      // notify cache that value is changed for the second time
      valueNotifyFn()
      expect(notifyFn).toHaveBeenCalledTimes(1)
      expect(valueUnsubFn).toHaveBeenCalledTimes(1)
    })
  })
})

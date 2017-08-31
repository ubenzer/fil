import {__RewireAPI__ as RCRewire, ReactiveCache} from '../app/reactiveCache'
import {it} from 'jasmine-promise-wrapper'
import {noop} from './helpers'

let cache = null

beforeEach(() => {
  cache = new ReactiveCache()
})

afterEach(() => {
  RCRewire.__ResetDependency__('writeObject')
  RCRewire.__ResetDependency__('readObject')
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
      expect(cache._cache[id]).toEqual(jasmine.any(Object))
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
      expect(cache._cache[id]).toEqual(jasmine.any(Object))
      expect(valueUnsubFn).toHaveBeenCalledTimes(0)

      // notify cache that value is changed
      valueNotifyFn()

      // check if we take proper actions
      expect(notifyFn).toHaveBeenCalledTimes(1)
      expect(notifyFn).toHaveBeenCalledWith({oldValue: 'value'})
      expect(cache._cache[id]).not.toEqual(jasmine.any(Object))
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
      expect(cache._cache[id]).not.toEqual(jasmine.any(Object))
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

  describe('removing an item', () => {
    it('removes item from cache, stops listening to changes and returns it', async () => {
      // prepare the item
      const id = 'id'
      const valueUnsubFn = jasmine.createSpy('valueUnsubFn')
      const valueFn = async () => 'value'
      const watchFn = () => ({unsubscribe: valueUnsubFn})

      await cache.calculate({id, valueFn, watchFn})

      const itemValue = cache.remove({id})

      expect(itemValue).toEqual('value')
      expect(cache._cache[id]).not.toEqual(jasmine.any(Object))
      expect(valueUnsubFn).toHaveBeenCalledTimes(1)

      const itemValueAgain = cache.remove({id})
      expect(itemValueAgain).toEqual(null)
      expect(valueUnsubFn).toHaveBeenCalledTimes(1)
    })
    it('does nothing when item is not in the cache in the first place', async () => {
      const itemValue = cache.remove({id: 'not-there'})
      expect(itemValue).toEqual(null)
    })
  })

  describe('persistence', () => {
    it('persists cache', async () => {
      const writeObjectMock = jasmine.createSpy('writeObject', async () => 'response').and.callThrough()
      RCRewire.__Rewire__('writeObject', writeObjectMock)

      const cachePath = 'cachePath'
      const key = 'key'

      // item1
      await cache.calculate({
        id: 'id1',
        valueFn: async () => 'value1',
        watchFn: noop
      })

      // item2
      await cache.calculate({
        id: 'id2',
        valueFn: async () => 'value2',
        watchFn: noop
      })

      const response = await cache.persistCache({cachePath, key})
      expect(response).toEqual('response')
      expect(writeObjectMock).toHaveBeenCalledTimes(1)
      expect(writeObjectMock).toHaveBeenCalledWith({
        cachePath,
        key,
        object: [
          {
            id: 'id1',
            value: 'value1'
          },
          {
            id: 'id2',
            value: 'value2'
          }
        ]
      })
    })

    it('loads pre-persisted cache', async () => {
      const readObjectMock = jasmine.createSpy('readObject', async () => [
        {
          id: 'id1',
          value: 'value1'
        },
        {
          id: 'id2',
          value: 'value2'
        }
      ]).and.callThrough()
      RCRewire.__Rewire__('readObject', readObjectMock)

      const watchFnMock = jasmine.createSpy('watchFnMock')
      const notifyFnMock = jasmine.createSpy('notifyFnMock')

      const cachePath = 'cachePath'
      const key = 'key'
      const functionLoaderFn = jasmine.createSpy('functionLoaderFn', () => ({
        notifyFn: notifyFnMock,
        watchFn: watchFnMock
      })).and.callThrough()
      await cache.loadCache({cachePath, functionLoaderFn, key})

      expect(readObjectMock).toHaveBeenCalledTimes(1)
      expect(readObjectMock).toHaveBeenCalledWith({
        cachePath,
        key
      })
      expect(Object.keys(cache._cache).length).toEqual(2)
      expect(cache._cache.id2.notifyFn).toEqual(notifyFnMock)
      expect(watchFnMock).toHaveBeenCalledTimes(2)
    })

    it('skips loading, if there is saved data', async () => {
      const readObjectMock = jasmine.createSpy('readObject', async () => null).and.callThrough()
      RCRewire.__Rewire__('readObject', readObjectMock)

      const cachePath = 'cachePath'
      const key = 'key'
      const functionLoaderFn = jasmine.createSpy('functionLoaderFn')
      await cache.loadCache({cachePath, functionLoaderFn, key})

      expect(functionLoaderFn).toHaveBeenCalledTimes(0)
      expect(readObjectMock).toHaveBeenCalledTimes(1)
      expect(readObjectMock).toHaveBeenCalledWith({
        cachePath,
        key
      })
      expect(Object.keys(cache._cache).length).toEqual(0)
    })
  })
})

import {RouteManager} from '../app/routeManager'
import {it} from 'jasmine-promise-wrapper'

let mockProject

beforeEach(() => {
  mockProject = {
    _project: {
      routeHandlers: {
        testHandler1: {},
        testHandler2: {}
      }
    }
  }
})

describe('RouteManager', () => {
  describe('handledUrls', () => {
    it('returns handled url list', async () => {
      mockProject.metaOf = jasmine.createSpy('metaOf', async ({type}) => ({
        children: [
          {
            _data: `data@${type}`,
            id: `/url@${type}`
          },
          {id: '/duplicateUrl'}
        ]
      })).and.callThrough()

      const routeManager = new RouteManager({project: mockProject})
      const output = await routeManager.handledUrls()

      expect(mockProject.metaOf).toHaveBeenCalledTimes(2)
      expect(mockProject.metaOf).toHaveBeenCalledWith({
        id: null,
        type: 'testHandler2'
      })

      expect(Object.keys(output.duplicates).length).toEqual(1)
      expect(output.duplicates['/duplicateUrl']).toEqual({handler: ['testHandler2', 'testHandler1']})
      expect(output.urls.length).toEqual(3)
      expect(output.urls).toContain({
        data: 'data@testHandler2',
        handler: 'testHandler2',
        url: '/url@testHandler2'
      })
    })
  })

  describe('handle', () => {
    it('handles a url', async () => {
      const routeManager = new RouteManager({project: mockProject})
      routeManager.handledUrls = jasmine.createSpy('handledUrls', async () => ({
        duplicates: {},
        urls: [
          {
            data: 'data@testHandler2',
            handler: 'testHandler2',
            url: '/testHandler2Url'
          },
          {
            data: 'data@testHandler',
            handler: 'testHandler',
            url: '/testHandlerUrl'
          }
        ]
      })).and.callThrough()
      mockProject.valueOf = jasmine.createSpy('valueOf', async () => ({body: 'body'})).and.callThrough()

      const output = await routeManager.handle({url: '/testHandlerUrl'})
      expect(output.body).toEqual('body')

      expect(routeManager.handledUrls).toHaveBeenCalledTimes(1)
      expect(mockProject.valueOf).toHaveBeenCalledTimes(1)
      expect(mockProject.valueOf).toHaveBeenCalledWith({
        _data: 'data@testHandler',
        id: '/testHandlerUrl',
        type: 'testHandler'
      })
    })

    it('throws an error if a url is handled by more than one handler', async () => {
      const routeManager = new RouteManager({project: mockProject})
      const duplicates = {'/duplicate': {handler: ['testHandler']}}
      routeManager.handledUrls = async () => ({
        duplicates,
        urls: [
          {
            handler: 'testHandler2',
            url: '/duplicate'
          }
        ]
      })
      const errorTextSpy = spyOn(RouteManager, 'generateDuplicateUrlErrorText').and.returnValue('text')

      try {
        await routeManager.handle({url: '/duplicate'})
        fail('should not get here')
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error))
        expect(e.message).toEqual('text')
        expect(errorTextSpy).toHaveBeenCalledTimes(1)
        expect(errorTextSpy).toHaveBeenCalledWith(duplicates)
      }
    })

    it('throws an if url is not handled (aka. 404)', async () => {
      const routeManager = new RouteManager({project: mockProject})
      routeManager.handledUrls = async () => ({
        duplicates: {},
        urls: [
          {
            handler: 'testHandler',
            url: '/not-tested-url'
          }
        ]
      })

      try {
        await routeManager.handle({url: '/404'})
        fail('should not get here')
      } catch (e) {
        expect(e).toEqual(jasmine.any(Error))
        expect(e.message).toEqual('404')
      }
    })
  })

  describe('handleAll', () => {
    it('handles all urls one by and and calls a function for each one of them', async () => {
      const routeManager = new RouteManager({project: mockProject})
      routeManager._handledUrlsPerHandler = async () => ({
        handler1: [
          {
            data: 'data@h1u1',
            url: '/h1u1'
          },
          {
            data: 'data@h1u2',
            url: '/h1u2'
          }
        ],
        handler2: [
          {
            data: 'data@h2u1',
            url: '/h2u1'
          },
          {
            data: 'data@h2u2',
            url: '/h2u2'
          }
        ]
      })
      mockProject.valueOf = jasmine.createSpy('valueOf', async ({data, id, type}) =>
        ({body: `${data}-${id}-${type}`})).and.callThrough()

      const urlProcessFn = jasmine.createSpy('urlProcessFn', async () => '').and.callThrough()
      await routeManager.handleAll({urlProcessFn})

      expect(mockProject.valueOf).toHaveBeenCalledTimes(4)
      expect(mockProject.valueOf).toHaveBeenCalledWith({
        data: 'data@h1u2',
        id: '/h1u2',
        type: 'handler1'
      })
      expect(mockProject.valueOf).toHaveBeenCalledWith({
        data: 'data@h2u2',
        id: '/h2u2',
        type: 'handler2'
      })

      expect(urlProcessFn).toHaveBeenCalledTimes(4)
      expect(urlProcessFn).toHaveBeenCalledWith({
        body: 'data@h2u2-/h2u2-handler2',
        handlerId: 'handler2',
        url: '/h2u2'
      })
    })
  })

  describe('generateDuplicateUrlErrorText', () => {
    it('generates a nice text that complains', () => {
      const duplicates = {
        '/url1': {handler: ['h1', 'h2']},
        '/url2': {handler: ['h2', 'h3']}
      }
      const msg = RouteManager.generateDuplicateUrlErrorText(duplicates)
      expect(msg).toContain('/url1 is handled by h1, h2')
      expect(msg).toContain('/url2 is handled by h2, h3')
    })
  })
})

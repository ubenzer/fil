import {Project} from '../app/project'
import {RouteManager} from '../app/routeManager'
import {it} from 'jasmine-promise-wrapper'

const mockProject = new Project({
  project: {
    routeHandlers: {
      testHandler1: {handles: async () => ['a', '/duplicateUrl']},
      testHandler2: {
        handle: async ({url}) => ({body: `@@${url}`}),
        handles: async () => ['b', '/aUrl', '/duplicateUrl']
      }
    }
  }
})

describe('RouteManager', () => {
  it('returns handled urls per handler', async () => {
    const routeManager = new RouteManager({project: mockProject})
    const handledUrls = await routeManager.handledUrlsPerHandler()
    expect(handledUrls).toEqual(jasmine.any(Object))
    expect(Object.keys(handledUrls).length).toEqual(2)
    expect(handledUrls.testHandler1).toContain('a')
  })

  it('returns handled url list', async () => {
    const routeManager = new RouteManager({project: mockProject})
    const handledUrls = await routeManager.handledUrls()
    expect(handledUrls.length).toEqual(5)
    expect(handledUrls).toContain('a')
    expect(handledUrls).toContain('b')
  })

  it('handles a url and generates a body', async () => {
    const routeManager = new RouteManager({project: mockProject})
    const output = await routeManager.handle({url: '/aUrl'})

    expect(output).toEqual(jasmine.any(Object))
    expect(output.body).toEqual('@@/aUrl')
  })

  it('throws an error if a url is handled by more than one handler', async () => {
    const routeManager = new RouteManager({project: mockProject})
    try {
      await routeManager.handle({url: '/duplicateUrl'})
      fail('should not get here')
    } catch (e) {
      expect(e).toEqual(jasmine.any(Error))
    }
  })
})

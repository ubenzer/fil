import {Project} from '../app/project'
import {RouteManager} from '../app/routeManager'
import {it} from 'jasmine-await'

const mockProject = new Project({
  project: {
    routeHandlers: () => ({
      testHandler1: {
        handles: async () => ['a'],
        handlesArguments: async () => ({})
      }
    })
  }
})

describe('RouteManager', () => {
  it('returns handled url list', async () => {
    const routeManager = new RouteManager({project: mockProject})
    const handledUrls = await routeManager.handledUrls()
    expect(handledUrls.length).toEqual(1)
  })
})

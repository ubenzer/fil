export const sort = ({array, reversed, selectorFn, sorterFn}) =>
  [...array].sort((content1, content2) => {
    const value1 = selectorFn(content1)
    const value2 = selectorFn(content2)
    const result = sorterFn(value1, value2)
    return reversed ? result * -1 : result
  })

export const textSorter = (a, b) => a.localeCompare(b)

export const dateSorter = (a, b) => a - b

export const postDateSelector = (post) => post.createDate

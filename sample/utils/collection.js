const chunk = ({array, chunkSize}) => {
  const tbReturned = []

  for (let i = 0; i < array.length; i += chunkSize) {
    tbReturned.push(array.slice(i, i + chunkSize))
  }

  return tbReturned
}

export const calculatePagination = ({array, chunkSize}) => {
  const chunks = chunk({array, chunkSize})
  return chunks.map((c, index) => {
    const isFirstPage = index === 0
    const isLastPage = index === chunks.length - 1
    const pageNumber = index + 1
    return {content: c, isFirstPage, isLastPage, pageNumber}
  })
}

import hasher from "folder-hash"

export const hashOf = async ({p}) =>
  hasher.hashElement(p, {
    excludes: [".*"],
    match: {
      basename: true,
      path: false
    }
  })
  .then((hashData) => hashData.hash)


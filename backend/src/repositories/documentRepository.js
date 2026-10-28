const documents = new Map();

function save(document) {
  documents.set(document.id, { ...document });
  return { ...document };
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function findAllByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

module.exports = {
  save,
  findById,
  findAllByOwner,
};
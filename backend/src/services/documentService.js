const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function normalizeOriginalName(originalName) {
  const filename = String(originalName || '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  return filename || 'document';
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocument(file, owner) {
  const document = documentRepository.save({
    id: randomUUID(),
    originalName: normalizeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
    mimeType: file.mimetype,
  });

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository
    .findAllByOwner(owner)
    .map(toPublicDocument);
}

function findDocumentForOwner(id, owner) {
  const document = documentRepository.findById(id);
  return document && document.owner === owner ? document : null;
}

module.exports = {
  createDocument,
  listDocuments,
  findDocumentForOwner,
};
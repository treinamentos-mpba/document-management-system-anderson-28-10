const fileRepository = require('../repositories/fileRepository');
const documentService = require('../services/documentService');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function requireUser(req, res, next) {
  const userId = req.get('X-User-Id');

  if (!userId || !userId.trim()) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'O cabeçalho X-User-Id é obrigatório.'
    );
  }

  req.userId = userId.trim();
  return next();
}

function upload(req, res, next) {
  if (!req.file) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Envie um arquivo no campo "file".'
    );
  }

  try {
    const document = documentService.createDocument(req.file, req.userId);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    const documents = documentService.listDocuments(req.userId);
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(req.params.id)) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'O identificador do documento é inválido.'
    );
  }

  const document = documentService.findDocumentForOwner(
    req.params.id,
    req.userId
  );

  if (!document) {
    return sendError(
      res,
      404,
      'DOCUMENT_NOT_FOUND',
      'Documento não encontrado.'
    );
  }

  let filePath;
  try {
    filePath = fileRepository.getPath(document.storageName);
  } catch (error) {
    return next(error);
  }

  return res.download(filePath, document.originalName, (error) => {
    if (!error) {
      return;
    }

    if (res.headersSent) {
      return next(error);
    }

    if (error.code === 'ENOENT') {
      return sendError(
        res,
        404,
        'DOCUMENT_NOT_FOUND',
        'Documento não encontrado.'
      );
    }

    return next(error);
  });
}

module.exports = {
  requireUser,
  upload,
  list,
  download,
};
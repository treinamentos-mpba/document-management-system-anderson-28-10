const express = require('express');
const documentController = require('../controllers/documentController');
const fileRepository = require('../repositories/fileRepository');

const router = express.Router();

router.post(
	'/upload',
	documentController.requireUser,
	fileRepository.upload.single('file'),
	documentController.upload
);
router.get('/documents', documentController.requireUser, documentController.list);
router.get(
	'/documents/:id/download',
	documentController.requireUser,
	documentController.download
);

module.exports = router;
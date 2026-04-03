const express = require('express');
const { auth } = require('../middleware/auth');
const { discoverUsers, createConnection, getConnections, updateConnectionStatus } = require('../controllers/connectionController');

const router = express.Router();

router.use(auth);
router.get('/discover-users', discoverUsers);
router.get('/', getConnections);
router.post('/', createConnection);
router.put('/:id/status', updateConnectionStatus);

module.exports = router;

const express = require('express');
const router = express.Router();

const {newSick, 
	   getSicks,
	   getSingleSick,
	   updateSick,
	   deleteSick
	} = require('../controllers/sickController');

const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/auth');

router.route('/admin/sick/new').post(isAuthenticatedUser,authorizeRoles('personnel'), newSick);
// router.route('/admin/sick/new').post(newSick);

router.route('/sicks').get(getSicks);
router.route('/sick/:id').get( getSingleSick);

router.route('/admin/sick/:id').put(isAuthenticatedUser,authorizeRoles('personnel'), updateSick).delete(isAuthenticatedUser, authorizeRoles('personnel'), deleteSick);
// router.route('/admin/sick/:id').put(updateSick).delete(deleteSick);

module.exports = router;
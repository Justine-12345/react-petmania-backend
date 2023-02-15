const express = require('express');
const router = express.Router();

const {newAnimal, 
	   getAnimals,
	   getSingleAnimal,
	   updateAnimal,
	   deleteAnimal,
	   adoptAnimal,
	   adoptAnimalAccept,
	   rescuedMonthly,
	   adoptedMonthly,
	   animalComment,
	   adoptAnimalDecline} = require('../controllers/animalController');

const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/auth');



router.route('/admin/animal/new').post(isAuthenticatedUser,authorizeRoles('personnel'), newAnimal);
// router.route('/admin/animal/new').post(newAnimal);


router.route('/animals').get(getAnimals);
router.route('/animal/:id').get( getSingleAnimal);

router.route('/admin/animal/:id').put(isAuthenticatedUser,authorizeRoles('personnel'), updateAnimal).delete(isAuthenticatedUser, authorizeRoles('personnel'), deleteAnimal);
// router.route('/admin/animal/:id').put(updateAnimal).delete(deleteAnimal);



router.route('/adopt/animal/:id').put(isAuthenticatedUser,authorizeRoles('adopter'), adoptAnimal)

router.route('/adopt-accept/animal/:id').put(isAuthenticatedUser,authorizeRoles('personnel'), adoptAnimalAccept)
router.route('/adopt-decline/animal/:id/:user').put(isAuthenticatedUser,authorizeRoles('personnel'), adoptAnimalDecline)


router.route('/admin/monthly-rescued/').get(rescuedMonthly);

router.route('/admin/monthly-adopted/').get(adoptedMonthly);


router.route('/animal/comment/').put(animalComment);

module.exports = router;
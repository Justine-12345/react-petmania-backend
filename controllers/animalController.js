const Animal = require('../models/animal')
const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures') 
const cloudinary = require('cloudinary')
const { ObjectId } = require('mongodb');


exports.newAnimal = catchAsyncErrors(async(req, res, next) => {

	try{

	}
	catch{next}
		
	let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    let imagesLinks = [];

    if(req.body.images){
	    for (let i = 0; i < images.length; i++) {
	        const result = await cloudinary.v2.uploader.upload(images[i], {
	            folder: 'animals'
	        });

	        imagesLinks.push({
	            public_id: result.public_id,
	            url: result.secure_url
	        })
	    }
	}


	
    let sicks = [];


   	if(req.body.sicks){
    if(typeof req.body.sicks == "string"){
			sicks.push({sick:req.body.sicks})
		}
	else{
	    for (let i = 0; i < req.body.sicks.length ; i++) {
	    	const sick = req.body.sicks[i];
	        const id = sick;
	        sicks.push({sick:id})
	    }
	}
	}
	else{
		req.body.health = "healthy"
	}



    req.body.images = imagesLinks
    req.body.sicks = sicks

	const animal = await Animal.create(req.body);
	
	res.status(201).json({
		success: true,
		animal
	})
})




exports.getAnimals = catchAsyncErrors(async(req, res, next) => {

	const onlyUnique =(value, index, self) =>{
	  return self.indexOf(value) === index;
	}



	const partialAnimals = await Animal.find();
	let allBreedsPartial = []

  	for (var i = 0; i < partialAnimals.length; i++) {
  		const animal = partialAnimals[i]
  		allBreedsPartial.push(animal.breed)
  	}

  	var allBreeds = allBreedsPartial.filter(onlyUnique);

	const resPerPage = 8;
	const animalsCount = await Animal.countDocuments();
	const apiFeatures = new APIFeatures(Animal.find().sort({_id: -1}).populate('adopt.adopter'), req.query).search().filter();

	if (req.query.keyword){
	apiFeatures.pagination(resPerPage);
	}
	// if(req.query.scroll){
	// apiFeatures.infiniteScroll();
	// }

	const animals = await apiFeatures.query;

	let filteredAnimalCount = animals.length;

	if (!animals) {
		return next(new ErrorHandler('Animals not found', 404))
	}

	




	res.status(200).json({
		success:true,
		animalsCount,
		resPerPage,
		filteredAnimalCount,
		animals,
		allBreeds
	})
})


exports.getSingleAnimal = catchAsyncErrors(async(req, res, next) => {
	const animal = await Animal.findById(req.params.id).populate('sicks.sick').populate('adopt.adopter');
	

	if(!animal){
		return next(new ErrorHandler('Animal not found', 404))
	}

	res.status(200).json({
		success:true,
		animal
	})
})


exports.updateAnimal = catchAsyncErrors(async(req, res, next) => {
	
	// console.log(req.body)

	let animal = await Animal.findById(req.params.id);

    if (!animal) {
        return next(new ErrorHandler('Animal not found', 404));
    }

    let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    if (images !== undefined) {

        // Deleting images associated with the product
        for (let i = 0; i < animal.images.length; i++) {
            const result = await cloudinary.v2.uploader.destroy(animal.images[i].public_id)
        }

        let imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'animals'
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }

        req.body.images = imagesLinks

    }

    let sicks = [];

    if(req.body.sicks){
    	req.body.health = "sick"
	    if(typeof req.body.sicks == "string"){
				sicks.push({sick:req.body.sicks})
			}
		else{
		    for (let i = 0; i < req.body.sicks.length ; i++) {
		    	const sick = req.body.sicks[i];
		        const id = sick;
		        sicks.push({sick:id})
		    }
		}
	}else{
		req.body.health = "healthy"

	}


	req.body.sicks = sicks
	

	animal = await Animal.findByIdAndUpdate(req.params.id, req.body,{
		new:true,
		runValidators: true,
		useFindModify:false
	})

	res.status(200).json({
		success:true,
		animal
	})

})

exports.deleteAnimal = catchAsyncErrors(async(req, res, next) => {
	const animal = await Animal.findById(req.params.id);

	if(!animal){
		return next(new ErrorHandler('Animal not found', 404));
	}

	await animal.remove();
	res.status(200).json({
		success: true,
		message: 'Animal deleted'
	})
})





exports.adoptAnimal = catchAsyncErrors(async(req, res, next) => {
	const animal = await Animal.findById(req.params.id);
	const user = await User.findById(req.user.id)

	if(!animal){
		return next(new ErrorHandler('Animal not found', 404));
	}

	let animalID = [...user.adopted, {animal:animal._id}]


	// animalID.push({animal:animal._id})

	user.adopted = animalID;
	animal.adopt.adopter = req.user.id;
	animal.adopt.adoptStatus = "pending";

	await animal.save();
	await user.save();

	res.status(200).json({
		success: true,
		message: 'Animal adoption pending...'
	})
})




exports.adoptAnimalDecline = catchAsyncErrors(async(req, res, next) => {
		
	const animal = await Animal.findById(req.params.id);
	const user = await User.findById(req.params.user)


	if(!animal){
		return next(new ErrorHandler('Animal not found', 404));
	}

	let animalsID = [...user.adopted]
	let newAnimalID = []


	for (var i = 0; i < animalsID.length; i++) {
		const animal = animalsID[i]
			if(animal.animal.toString() != req.params.id){
				newAnimalID.push(animal)
			}
	
	}

	user.adopted = newAnimalID;
	animal.adopt.adopter = undefined;
	animal.adopt.adoptStatus = "unAdopt";

	await animal.save();
	await user.save();

	// animal.adopt.adoptDate = Date();
	// animal.adopt.adoptStatus = "adopted";

	// await animal.save();

	res.status(200).json({
		success: true,
		animal
	})
})







exports.adoptAnimalAccept = catchAsyncErrors(async(req, res, next) => {
		
	const animal = await Animal.findById(req.params.id);

	if(!animal){
		return next(new ErrorHandler('Animal not found', 404));
	}

	animal.adopt.adoptDate = Date();
	animal.adopt.adoptStatus = "adopted";

	await animal.save();

	res.status(200).json({
		success: true,
		animal
	})
})







exports.rescuedMonthly = catchAsyncErrors(async(req, res, next) => {
	
	// console.log(req.query.start);
	let animals

	if(req.query.start && req.query.end){
		animals = await Animal.find({createdAt:{$gte:req.query.start,$lt:req.query.end}});
	}
	else{
		animals = await Animal.find();
	}


	if (!animals) {
		return next(new ErrorHandler('Animals not found', 404))
	}


	const _=require('lodash');

	const re=_.groupBy(animals,function(item){
    	return (new Date(item.createdAt).getMonth());
	})


	for (var i = 0; i < re.length; i++) {
		// console.log(re[i])
		output
	}

	let rescuedMonthName =[]
	let rescuedMonthValue =[]

	const month = ["January","February","March","April","May","June","July",
            "August","September","October","November","December"]
	const monthIndex = Object.keys(re);
	const monthRescued = Object.values(re);

	for (var i = 0; i < monthIndex.length; i++) {

		rescuedMonthName.push(month[monthIndex[i]]);

	}

	for (var i = 0; i < monthRescued.length; i++) {

		rescuedMonthValue.push(monthRescued[i].length);

	}

	res.status(200).json({
		success: true,
		animalsCount:animals.length,
		rescuedMonthName,
		rescuedMonthValue,
	})
})





exports.adoptedMonthly = catchAsyncErrors(async(req, res, next) => {
	
	// console.log(req.query.start);
	let animals

	if(req.query.start && req.query.end){
		animals = await Animal.find({"adopt.adoptDate":{$gte:req.query.start,$lt:req.query.end}});
	}
	else{
		animals = await Animal.find();
	}


	
	const _=require('lodash');

	const re=_.groupBy(animals,function(item){
    	return (new Date(item.adopt.adoptDate).getMonth());
	})


	for (var i = 0; i < re.length; i++) {
		// console.log(re[i])
		output
	}

	let partialAdoptedMonthName =[]
	let adoptedMonthValue =[]

	const month = ["January","February","March","April","May","June","July",
            "August","September","October","November","December"]
	const monthIndex = Object.keys(re);
	const monthAdopted = Object.values(re);

	for (var i = 0; i < monthIndex.length; i++) {
			partialAdoptedMonthName.push(month[monthIndex[i]]);
	}

	var adoptedMonthName = partialAdoptedMonthName.filter(function (el) {
	  return el != null;
	});

	for (var i = 0; i < adoptedMonthName.length; i++) {
		adoptedMonthValue.push(monthAdopted[i].length);
	}

	

	res.status(200).json({
		success: true,
		animalsCount:animals.length,
		adoptedMonthName,
		adoptedMonthValue,
	})

})





exports.animalComment = catchAsyncErrors(async(req, res, next) => {
	

	let animal = await Animal.findById(req.body.animalId);

    // const comments = animal.comments;

	const comments = [...animal.comments,{name:req.body.name, content:req.body.content}];

	// animal = await Animal.findByIdAndUpdate(req.params.id, animal,{
	// 	new:true,
	// 	runValidators: false,
	// 	useFindModify:false
	// })
	animal.comments = comments;

	await animal.save();


	res.status(200).json({
		success:true,
		animal
	})

})
const Sick = require('../models/sick')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures') 


exports.newSick = catchAsyncErrors(async(req, res, next) => {
	const sick = await Sick.create(req.body);
	res.status(201).json({
		success: true,
		sick
	})
})



exports.getSicks = catchAsyncErrors(async(req, res, next) => {

	const resPerPage = 4;
	const sicksCount = await Sick.countDocuments();
	const apiFeatures = new APIFeatures(Sick.find().sort({_id: -1}), req.query).search().filter();

	apiFeatures.pagination(resPerPage);
	
	const sicks = await apiFeatures.query;

	let filteredSickCount = sicks.length;

	if (!sicks) {
		return next(new ErrorHandler('Sicks not found', 404))
	}

	res.status(200).json({
		success:true,
		sicksCount,
		resPerPage,
		filteredSickCount,
		sicks
	})
})


exports.getSingleSick = catchAsyncErrors(async(req, res, next) => {
	const sick = await Sick.findById(req.params.id);

	if(!sick){
		return next(new ErrorHandler('Sick not found', 404))
	}

	res.status(200).json({
		success:true,
		sick
	})
})


exports.updateSick = catchAsyncErrors(async(req, res, next) => {
	let sick = await Sick.findById(req.params.id);

	if(!sick){
		return next(new ErrorHandler('Sick not found', 400))
	}

	sick = await Sick.findByIdAndUpdate(req.params.id, req.body,{
		new:true,
		runValidators: true,
		useFindModify:false
	})

	res.status(200).json({
		success:true,
		sick
	})

})

exports.deleteSick = catchAsyncErrors(async(req, res, next) => {
	const sick = await Sick.findById(req.params.id);

	if(!sick){
		return next(new ErrorHandler('Sick not found', 404));
	}

	await sick.remove();
	res.status(200).json({
		success: true,
		message: 'Sick deleted'
	})
})
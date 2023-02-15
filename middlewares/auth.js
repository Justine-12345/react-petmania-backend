const User = require('../models/user');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorHandler');

//check if user is authenticated or not
exports.isAuthenticatedUser = async (req, res, next) => {

	// const {token} = req.cookies

	let token
	if(req.headers.token){
		token = req.headers.token
	}else{
		token = req.cookies.token
	}
	console.log("req.headers", req.headers)
	console.log("req.cookies", req.cookies)

	if(!token){
		return next(new ErrorHandler('Login first to access this resource.', 401))
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	req.user = await User.findById(decoded.id);

	next()

}


//Handling users roles
exports.authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if(!roles.includes(req.user.role)){
			return next(
					new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403)
				)
		}
		next()
	}
}
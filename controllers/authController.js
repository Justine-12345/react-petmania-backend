const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendToken = require('../utils/jwtToken');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const cloudinary = require('cloudinary');
const fetch = require('node-fetch');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("101367040621-btgoj7nqib3bps5592vv9ng9l43ld88k.apps.googleusercontent.com")

exports.registerUser = catchAsyncErrors(async(req, res, next) => {
	  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    })
	  
	const{name, age, gender, address, contact, email, password, role, roleDesc} = req.body;
	const user = await User.create({
		name,
		age,
		gender,
		address,
		contact,
		email,
		password,
		role,
		roleDesc,
		avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
	})

	//test token
	// const token = user.getJwtToken();

	// res.status(201).json({
	// 	success:true,
	// 	user,
	// 	token
	// })

	sendToken(user,200,res)
})


exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

	const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    sendToken(user, 200, res)
})



exports.logout = catchAsyncErrors(async (req, res, next) => {
	res.cookie('token', null,{
		expires:new Date(Date.now()),
		httpOnly:true
	})

	res.status(200).json({
		success:true,
		message:'Logged out'
	})
})


exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	

	res.status(200).json({
		success: true,
		user
	})
})


exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('password');

	// Check previous user password
	const isMatched = await user.comparePassword(req.body.oldPassword)

	if(!isMatched){
		return next(new ErrorHandler('Old password is incorrect'));
	}

	user.password = req.body.password;
	await user.save();

	const updatedUser = await User.findById(req.user.id).populate('adopted.animal');

	sendToken(updatedUser, 200, res)
})



exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
	
	const newUserData = {
		name: req.body.name,
		age:req.body.age,
		gender:req.body.gender,
		address:req.body.address,
		contact:req.body.contact,
		role:req.body.role,
		roleDesc:req.body.roleDesc,
		email: req.body.email

	}

	// Update avatar
    if (req.body.avatar !== '') {
        const user = await User.findById(req.user.id)

        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }


	const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
		new:true,
		runValidators: true,
	}).populate('adopted.animal');

	res.status(200).json({
		success:true,
		user
	})

})



exports.allUsers = catchAsyncErrors(async (req, res, next) => {
	const users = await User.find().sort({_id: -1});

	res.status(200).json({
		success:true,
		users
	})
})



exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
	const user = await User.findById(req.params.id).populate('adopted.animal');

	if(!user){
		return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
	}

	res.status(200).json({
		success:true,
		user
	})

})


exports.forgotPassword = catchAsyncErrors(async(req, res, next) => {
	const user = await User.findOne({email:req.body.email});

	if(!user){
		return next(new ErrorHandler('User not found with this email', 404));
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken();

	await user.save({validationBeforeSave: false});

	//Create reset password url
	const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

	const html = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>Your password reset token is below.If you have not requested this email, then ignore it.</p><br/><a href="${resetUrl}" style="background: #33cabb;padding: 12px;color:white;text-decoration: unset;box-shadow: 1px 1px 10px #c7c7c7;"><b>Reset Password</b></a></div></body>`


	const message = `<body style=" background: rgb(255,255,255);background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(210,255,236,1) 53%, rgba(169,246,255,1) 100%);"><br/><br/><div style="width:350px; text-align: center; margin: auto;font-family: arial; line-height: 25px;background: white;padding: 24px;box-shadow: 2px 2px 7px #9e9e9e;"><img src="https://static.vecteezy.com/system/resources/thumbnails/001/312/428/small/monitor-with-password-and-shield-free-vector.jpg"/><p>Your password reset token is below.If you have not requested this email, then ignore it.</p><br/><a href="${resetUrl}" style="background: #33cabb;padding: 12px;color:white;text-decoration: unset;box-shadow: 1px 1px 10px #c7c7c7;"><b>Reset Password</b></a></div></body>`

	try{

		await sendEmail({
			email: user.email,
			subject:'PetMania Password Recovery Email',
			message, 
			html
		})

		res.status(200).json({
			success:true,
			message:`Email sent to: ${user.email}`
		})

	}catch(error){
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({validationBeforeSave:false});

		return next(new ErrorHandler(error.message, 500))
	}

})


exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

	//Hash URL token
	const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire:{$gt:Date.now()}
	})

	if(!user){
		return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
	}

	if(req.body.password !== req.body.confirmPassword){
		return next(new ErrorHandler('Password does not match', 400))
	}

	//Setup new password
	user.password = req.body.password;

	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();

	sendToken(user, 200, res);

})


exports.updateUser = catchAsyncErrors(async (req, res, next) => {
	if(req.body.role !== "personnel"){
		req.body.roleDesc = 'none'
	}

   const newUserData = {
		name: req.body.name,
		age:req.body.age,
		gender:req.body.gender,
		address:req.body.address,
		contact:req.body.contact,
		role:req.body.role,
		roleDesc:req.body.roleDesc,
		email: req.body.email,
		
	}

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })

})


exports.deleteUser = catchAsyncErrors(async(req, res, next) => {
	const user = await User.findById(req.params.id);

	if(!user){
		return next(new ErrorHandler('User not found', 404));
	}

	const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

	await user.remove();
	res.status(200).json({
		success: true,
		message: 'User deleted'
	})
})



exports.googlelogin = async(req, res,next) => {
	const {tokenId} = req.body;

	const google = await client.verifyIdToken({idToken: tokenId, audience: "101367040621-btgoj7nqib3bps5592vv9ng9l43ld88k.apps.googleusercontent.com"})
	
	const {email_verified, name, email, picture} = google.payload

	const user = await User.findOne({email});

	if(user){
		sendToken(user, 200, res)
	}else{
		// console.log("not exist")

		const user = new User({
			name,
			email,
			avatar: {
	            public_id: picture,
	            url: picture
	        },
	        accType:"google"
		})

		user.save({validateBeforeSave: false });

		// console.log(user)
		sendToken(user,200,res)		
	}
		 
}




exports.facebooklogin = async(req, res)=>{
	const {userID, accessToken} = req.body;

	let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`

	const fetchRes = await fetch(urlGraphFacebook, {method:"GET"});
	const {email, name, picture} = await fetchRes.json()


	console.log(email, name, picture.data.url)


	const user = await User.findOne({email});

	if(user){
		// console.log("exist")
		sendToken(user, 200, res)
	}else{

		// console.log("not exist")

		const user = new User({
			name,
			email,
			avatar: {
	            public_id: picture.data.url,
	            url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
	        },
	        accType:"facebook"
		})

		user.save({validateBeforeSave: false });

		// console.log(user)
		sendToken(user,200,res)		
	}

}
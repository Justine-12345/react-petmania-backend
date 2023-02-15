const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name:{
		type:String,
		required:[true, 'Please enter your name'],
		maxLength:[30, 'Your name cannot exceed 30 character']
	},

	age:{
		type:String,
		required:[true,'Please enter your age']
	},

	gender:{
		type:String,
		required:[true,'Please enter your gender']
	},

	address:{
		type:String,
		required:[true,'Please enter your gender']
	},

	contact:{
		type:String,
		required:[true,'Please enter your gender'],
		maxLength:[30, 'Your name cannot exceed 30 character']
	},

	email:{
		type:String,
		required:[true, 'Please enter valid email'],
		unique: true,
		validate:[validator.isEmail, 'Please enter valid email address']
	},

	password:{
		type:String,
		required:[true, 'Please enter your password'],
		minlength:[6, 'Your password must be longer than 6 character'],
		select:false
	},

	avatar:{
		public_id:{
			type:String,
			required:true
		},
		url:{
			type:String,
			required:true
		}
	},

	adopted: [
        {
            animal: {
                type: mongoose.Schema.ObjectId,
                ref: 'Animal'
            }

        }
    ],

	role:{
		type:String,
		default:'user'
	},

	accType:{
		type:String,
		default:'local'
	},

	roleDesc:{
		type:String,
		default:'none'
	},

	createdAt:{
		type:Date,
		default:Date.now
	},

	resetPasswordToken: String,
	resetPasswordExpire: Date
})


userSchema.pre('save', async function(next){
	if(!this.isModified('password')){
		next()
	}
	this.password = await bcrypt.hash(this.password, 10)
});


userSchema.methods.getJwtToken = function(){
	return jwt.sign({id:this._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES_TIME});
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}


userSchema.methods.getResetPasswordToken = function (){
	//Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	//Hash and set to resetPasswordToken
	this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

	//Set token expire time
	this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

	return resetToken
}


module.exports = mongoose.model('user', userSchema);

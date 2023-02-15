const mongoose = require('mongoose')

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter animal name'],
        trim: true,
        maxLength: [100, 'Animal name cannot exceed 100 characters']
    },
   
   gender: {
        type: String,
        required: [true, 'Please enter animal gender'],
        trim: true,
    },

    age: {
        type: String,
        required: [true, 'Please enter animal age'],
        trim: true,
    },

    breed: {
        type: String,
        required: [true, 'Please enter animal breed'],
        trim: true,
        maxLength: [100, 'Animal name cannot exceed 100 characters']
    },

    health: {
        type: String,
        trim: true,
        default:'sick'
    },


    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        }
    ],

    category: {
        type: String,
        required: [true, 'Please select category for this animal'],
        enum: {
            values: [
                'Dog',
                'Cat'
            ],
            message: 'Please select correct category for this animal'
        }
    },
   
    sicks: [
        {
            sick:{
                type: mongoose.Schema.ObjectId,
                ref: 'Sick',
            }
        }
    ],

    adopt:{
            adopter: {
                type: mongoose.Schema.ObjectId,
                ref: 'user'
            },


            adoptStatus: {
                type: String,
                trim: true,
                default:'unAdopt'
            },


            adoptDate: {
                type: Date,
            }
    },

    comments:[
        {   

            name:{
                type: String,
                maxLength: [50, 'Author name cannot exceed 50 characters'],
                default:'Anonymous'
            },

            content:{
                type: String,
                required:true
            },

             createdAt: {
                type: Date,
                default: Date.now
            }

        }
    ],


    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Animal', animalSchema);
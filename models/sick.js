const mongoose = require('mongoose')

const sickSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter sick name'],
        trim: true,
    },
   
    description: {
        type: String,
        required: [true, 'Please enter sick description'],
        trim: true,
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Sick', sickSchema);
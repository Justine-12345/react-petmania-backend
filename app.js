const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

const path = require('path')
const cors = require('cors')
const app = express();
const auth = require('./routes/auth')
const animal = require('./routes/animal')
const sick = require('./routes/sick')
const errorMiddleware = require('./middlewares/errors')


app.use(express.json());
app.use(cors())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload())

app.get('/api/test', (req, res) => {
  res.send('congrats');
})


app.use('/api/v1', auth);
app.use('/api/v1', animal);
app.use('/api/v1', sick);


if (process.env.NODE_ENV !== 'PRODUCTION') 
      require('dotenv').config({ path: 'backend/config/config.env' })


    if (process.env.NODE_ENV === 'PRODUCTION') {
    app.use(express.static(path.join(__dirname, '../frontend/build')))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
    })
}


app.use(errorMiddleware);


module.exports = app
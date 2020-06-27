'use strict';

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const validate = require('url-validator')

const port = process.env.PORT || 3000
process.env.DB_URI = "mongodb+srv://user1:user1@fcccluster-ydzag.mongodb.net/fcc-url-shortener?retryWrites=true&w=majority"

const db = mongoose.connection

db.on("error", console.error.bind(console, "connection error:"))
db.once("open", function() {
  // we're connected!
  console.log('DB connection successful')
})

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const URI_SCHEMA = new mongoose.Schema({
  // author: String,
  uri: {
    type: String,
    required: [true, "The url is required!"],
  },
  redirect: {
    type: String,
    required: [true, "The redirect url ID is required!"],
  },
  date: {
    type: Date,
    required: [true, "The creation date is required!"],
  },
  // date: Date
})

// Define the mongo model
const URI_MODEL = mongoose.model('shortened urls', URI_SCHEMA)

var app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
})
  
// your first API endpoint... 
app.get('/api/shorturl/:urlID', function (req, res) {

  URI_MODEL.find({ redirect: req.params.urlID }, (err, data) => {
    if (data.length == 0) {
      return res.send("Short url not found")
    } else {
      return res.redirect(data[0].uri)
    }
  })
  
  // res.json({ greeting: req.params })
})

app.post('/api/shorturl/new', (req, res) => {

  const { url } = req.body

  // Validate URL
  const validUrl = validate(url)

  if(validUrl) {
    // check for existing url in database
    URI_MODEL.find({ uri: url }, (err, data) => {
      if (err) return console.error(err)
  
      console.log(data.length)
      if (data.length == 0) {
        
        // generate short url id
        URI_MODEL.find({},  (err, data) => {
          let urlID = data.length + 1
  
          if (err) return console.error(err)
  
          // Create and store url
          const userURI = new URI_MODEL({ 
            uri: url,
            redirect: urlID.toString(),
            date: Date.now()
          }).save(function (err, userURI) {
  
            if (err) return console.error(err)
            console.log('Short url saved succesfully')
            return res.json({
              exists: false,
              original_url: url,
              short_url: urlID
            })
  
          })
        })
  
      } else {
        // console.log('Existing Data found:', (data))
        return res.json({
          exists: true,
          original_url: url,
          short_url: data[0].redirect
        })
      }
      
    })
  } else {
    res.json({
      'error': 'Invalid URL'
    })
  }

})

app.listen(port, function () {
  console.log('Node.js listening on', `http://localhost:${ port }`);
})

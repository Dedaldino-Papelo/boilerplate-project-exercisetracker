const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
  username: { type: String },
})
let User = mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  date: { type: String },
})
let Exercise = mongoose.model('Exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
/*   await User.deleteMany()
  await Exercise.deleteMany() */
});

app.post('/api/users', async (req, res) => {
 const { username: freshUser } = req.body
 const user = new User({ username: freshUser })
 const newUser = await user.save()
 
  if(!newUser) return false
  const { username, _id } = newUser
  res.json({username, _id})
})

app.get('/api/users', async(req, res) => {
  const allUsers = await User.find()
  
  if(!allUsers) {
    res.send('there is no user')
  }
    res.json(allUsers)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id: id } = req.params
  const { description, duration, date } = req.body

  try {
    const user = await User.findById(id)
    
    if(!user) {
      res.send('could not find user')
      
    } else {
      const exerciseObj = new Exercise({
      user_id: user._id,
      description,
      duration,
      date: date? new Date(date) : new Date()
    })
    
    const exercise = await exerciseObj.save()
    
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    }) 
  }
  
  } catch(error) {
    console.log(error)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let { from, to, limit } = req.query
  const { _id:id } = req.params

  limit = limit  ? parseInt(limit):limit 

  let responseObj = {}
    queryObj = {}

  if(from || to) {
      queryObj.date = {}
      
    if(from) {
      queryObj.date['$gte'] = from
    }
      
    if(to) {
      queryObj.date['$lte'] = to
    }
  }
  

  const user = await User.findById(id)
  if(!user) {
    console.log('could not find user')
    return
  } 

  let username = user.username
  userId = user._id

  queryObj = {
    user_id: userId
  }
  
  responseObj = { _id: userId, username: username }

  let exercises = await Exercise.find(queryObj).limit(limit).exec()
  if(!exercises) return false

  exercises = exercises.map(x => {
    return {
      description: x.description,
      duration: x.duration,
      date: new Date(x.date).toDateString()
    }
  })
  
    responseObj.log = exercises
    responseObj.count = exercises.length
    res.json(responseObj)
})






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

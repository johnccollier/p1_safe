const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var ObjectId = Schema.ObjectId;

var UserSchema = new mongoose.Schema({
    id: ObjectId,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    FirstName: String,
    LastName: String,
    password: {
      type: String,
      required: true,
    },
    acctBalance: {
        type: Number,
        required: false   
    }
  });

  UserSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
  };



  //Hash password before saving to database
 UserSchema.pre('save', function (next) {
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    })
  }); 



var User = mongoose.model('User', UserSchema);
module.exports = User;
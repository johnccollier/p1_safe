const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var FeedbackSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true,
        },
        FullName: String,
        comment: {
            type: String
        }
  });

var Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports = Feedback;
import mongoose from 'mongoose';

const credentialsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },  
});

const User = mongoose.models.User || mongoose.model('User', credentialsSchema);

export default User;
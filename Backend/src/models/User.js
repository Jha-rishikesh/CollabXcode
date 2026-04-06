const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true // Ek email se ek hi account banega
  },
  password: { 
    type: String 
    // Ye 'required' nahi hai kyunki jo Google se aayega uska password humare paas nahi hoga
  },
  authProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
    // Ye batayega ki user ne Email se login kiya hai ya Google se
  },
  savedRooms: [{ 
    type: String 
    // Yahan hum user ke Room IDs save karenge (Max 2 wali limit hum API mein lagayenge)
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
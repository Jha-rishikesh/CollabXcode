const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ye hamare database ka secret link hoga
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
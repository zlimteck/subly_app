import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a user can't have duplicate category names
categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    'AI',
    'Cloud',
    'Education',
    'Entertainment',
    'Fitness',
    'Gaming',
    'Mobile',
    'Music',
    'News',
    'Productivity',
    'Software',
    'Streaming',
    'Other'
  ];
};

// Static method to create default categories for a user
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = this.getDefaultCategories();
  const categories = defaultCategories.map(name => ({
    user: userId,
    name,
    isDefault: true
  }));

  try {
    await this.insertMany(categories, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors (category already exists)
    if (error.code !== 11000) {
      throw error;
    }
  }
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
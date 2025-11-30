import express from 'express';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all categories for the current user
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id })
      .select('name isDefault')
      .sort({ isDefault: -1, name: 1 }); // Default categories first, then alphabetically

    // If user has no categories, create default ones
    if (categories.length === 0) {
      await Category.createDefaultCategories(req.user.id);
      const newCategories = await Category.find({ user: req.user.id })
        .select('name isDefault')
        .sort({ isDefault: -1, name: 1 });
      return res.json(newCategories);
    }

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new custom category
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({
      user: req.user.id,
      name: name.trim()
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      user: req.user.id,
      name: name.trim(),
      isDefault: false
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a custom category (only non-default categories)
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default categories' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
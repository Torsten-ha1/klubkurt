const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - Get all events (public endpoint)
router.get(
  '/',
  [
    query('upcoming')
      .optional()
      .isBoolean()
      .withMessage('upcoming must be a boolean'),
    query('tag')
      .optional()
      .isLength({ min: 1, max: 20 })
      .withMessage('tag must be between 1 and 20 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { upcoming, tag, limit } = req.query;
      let query = { isActive: true };

      // Filter for upcoming events
      if (upcoming === 'true') {
        query.date = { $gte: new Date() };
      }

      // Filter by tag
      if (tag) {
        query.tags = { $in: [tag.toLowerCase()] };
      }

      let eventsQuery = Event.find(query).sort({ date: 1 });

      // Apply limit if specified
      if (limit) {
        eventsQuery = eventsQuery.limit(parseInt(limit));
      }

      const events = await eventsQuery;

      res.json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        message: 'Error fetching events',
        error: error.message,
      });
    }
  }
);

// GET /api/events/:id - Get single event (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid event ID format',
      });
    }
    res.status(500).json({
      message: 'Error fetching event',
      error: error.message,
    });
  }
});

// POST /api/events - Create new event (admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('date')
      .isISO8601()
      .toDate()
      .withMessage('Date must be a valid ISO 8601 date'),
    body('lineup').optional().isArray().withMessage('Lineup must be an array'),
    body('lineup.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each artist name must be between 1 and 50 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Each tag must be between 1 and 20 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const event = new Event({
        title: req.body.title,
        date: req.body.date,
        lineup: req.body.lineup || [],
        tags: req.body.tags || [],
        description: req.body.description || '',
      });

      const savedEvent = await event.save();

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: savedEvent,
      });
    } catch (error) {
      console.error('Create event error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }
      res.status(500).json({
        message: 'Error creating event',
        error: error.message,
      });
    }
  }
);

// PUT /api/events/:id - Update event (admin only)
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('date')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Date must be a valid ISO 8601 date'),
    body('lineup').optional().isArray().withMessage('Lineup must be an array'),
    body('lineup.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each artist name must be between 1 and 50 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Each tag must be between 1 and 20 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedEvent) {
        return res.status(404).json({
          message: 'Event not found',
        });
      }

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent,
      });
    } catch (error) {
      console.error('Update event error:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          message: 'Invalid event ID format',
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }
      res.status(500).json({
        message: 'Error updating event',
        error: error.message,
      });
    }
  }
);

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid event ID format',
      });
    }
    res.status(500).json({
      message: 'Error deleting event',
      error: error.message,
    });
  }
});

module.exports = router;

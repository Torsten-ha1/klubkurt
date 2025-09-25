const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: function (date) {
          return date > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    lineup: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Artist name cannot exceed 50 characters'],
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [20, 'Tag cannot exceed 20 characters'],
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for better query performance
eventSchema.index({ date: 1, isActive: 1 });
eventSchema.index({ tags: 1 });

// Pre-save middleware to update the updatedAt field
eventSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function () {
  return this.find({
    date: { $gte: new Date() },
    isActive: true,
  }).sort({ date: 1 });
};

// Static method to get events by tag
eventSchema.statics.getByTag = function (tag) {
  return this.find({
    tags: { $in: [tag.toLowerCase()] },
    isActive: true,
  }).sort({ date: 1 });
};

// Instance method to format date for display
eventSchema.methods.getFormattedDate = function () {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

module.exports = mongoose.model('Event', eventSchema);

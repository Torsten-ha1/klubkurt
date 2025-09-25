const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema(
  {
    configType: {
      type: String,
      required: [true, 'Config type is required'],
      unique: true,
      enum: ['marquee', 'soundcloud'],
    },
    // For marquee configuration
    marqueeTexts: {
      type: [String],
      validate: {
        validator: function (texts) {
          return this.configType !== 'marquee' || (texts && texts.length === 4);
        },
        message: 'Marquee must have exactly 4 text strings',
      },
      maxlength: [50, 'Each marquee text cannot exceed 50 characters'],
    },
    // For SoundCloud configuration
    soundcloudUrl: {
      type: String,
      validate: {
        validator: function (url) {
          return (
            this.configType !== 'soundcloud' ||
            (url && url.includes('soundcloud.com'))
          );
        },
        message: 'Must be a valid SoundCloud URL',
      },
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
siteConfigSchema.index({ configType: 1 });

// Pre-save middleware to update the updatedAt field
siteConfigSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get configuration by type
siteConfigSchema.statics.getByType = function (configType) {
  return this.findOne({
    configType: configType,
    isActive: true,
  });
};

// Static method to get all active configurations
siteConfigSchema.statics.getAllActive = function () {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const SiteConfig = require('../models/SiteConfig');
const { authenticateToken } = require('../middleware/auth');

// GET /api/siteconfigs - Public endpoint to get all active site configurations
router.get('/', async (req, res) => {
  try {
    const configs = await SiteConfig.getAllActive();

    // Transform to a more convenient format for the frontend
    const configMap = {};
    configs.forEach((config) => {
      if (config.configType === 'marquee') {
        configMap.marquee = {
          id: config.id,
          texts: config.marqueeTexts,
          updatedAt: config.updatedAt,
        };
      } else if (config.configType === 'soundcloud') {
        configMap.soundcloud = {
          id: config.id,
          url: config.soundcloudUrl,
          updatedAt: config.updatedAt,
        };
      }
    });

    res.json({
      success: true,
      data: configMap,
    });
  } catch (error) {
    console.error('Error fetching site configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site configurations',
    });
  }
});

// GET /api/siteconfigs/:type - Public endpoint to get specific configuration
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;

    if (!['marquee', 'soundcloud'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration type',
      });
    }

    const config = await SiteConfig.getByType(type);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
    }

    const responseData = {
      id: config.id,
      configType: config.configType,
      updatedAt: config.updatedAt,
    };

    if (config.configType === 'marquee') {
      responseData.texts = config.marqueeTexts;
    } else if (config.configType === 'soundcloud') {
      responseData.url = config.soundcloudUrl;
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration',
    });
  }
});

// POST /api/siteconfigs - Admin only endpoint to create configuration
router.post(
  '/',
  authenticateToken,
  [
    body('configType')
      .isIn(['marquee', 'soundcloud'])
      .withMessage('Config type must be marquee or soundcloud'),
    body('marqueeTexts')
      .optional()
      .isArray({ min: 4, max: 4 })
      .withMessage('Marquee must have exactly 4 text strings')
      .custom((texts, { req }) => {
        if (req.body.configType === 'marquee') {
          if (!texts || texts.length !== 4) {
            throw new Error(
              'Marquee configuration requires exactly 4 text strings'
            );
          }
          texts.forEach((text, index) => {
            if (!text || text.trim().length === 0) {
              throw new Error(`Text ${index + 1} cannot be empty`);
            }
            if (text.length > 50) {
              throw new Error(`Text ${index + 1} cannot exceed 50 characters`);
            }
          });
        }
        return true;
      }),
    body('soundcloudUrl')
      .optional()
      .isURL()
      .withMessage('Must be a valid URL')
      .custom((url, { req }) => {
        if (req.body.configType === 'soundcloud') {
          if (!url || !url.includes('soundcloud.com')) {
            throw new Error('Must be a valid SoundCloud URL');
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { configType, marqueeTexts, soundcloudUrl } = req.body;

      const configData = { configType };

      if (configType === 'marquee') {
        configData.marqueeTexts = marqueeTexts;
      } else if (configType === 'soundcloud') {
        configData.soundcloudUrl = soundcloudUrl;
      }

      const config = new SiteConfig(configData);
      await config.save();

      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('Error creating site configuration:', error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Configuration for this type already exists',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create site configuration',
      });
    }
  }
);

// PUT /api/siteconfigs/:type - Admin only endpoint to update configuration
router.put(
  '/:type',
  authenticateToken,
  [
    body('marqueeTexts')
      .optional()
      .isArray({ min: 4, max: 4 })
      .withMessage('Marquee must have exactly 4 text strings')
      .custom((texts, { req }) => {
        if (req.params.type === 'marquee') {
          if (!texts || texts.length !== 4) {
            throw new Error(
              'Marquee configuration requires exactly 4 text strings'
            );
          }
          texts.forEach((text, index) => {
            if (!text || text.trim().length === 0) {
              throw new Error(`Text ${index + 1} cannot be empty`);
            }
            if (text.length > 50) {
              throw new Error(`Text ${index + 1} cannot exceed 50 characters`);
            }
          });
        }
        return true;
      }),
    body('soundcloudUrl')
      .optional()
      .isURL()
      .withMessage('Must be a valid URL')
      .custom((url, { req }) => {
        if (req.params.type === 'soundcloud') {
          if (!url || !url.includes('soundcloud.com')) {
            throw new Error('Must be a valid SoundCloud URL');
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { type } = req.params;
      const { marqueeTexts, soundcloudUrl } = req.body;

      if (!['marquee', 'soundcloud'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration type',
        });
      }

      const config = await SiteConfig.getByType(type);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
      }

      if (type === 'marquee' && marqueeTexts) {
        config.marqueeTexts = marqueeTexts;
      } else if (type === 'soundcloud' && soundcloudUrl) {
        config.soundcloudUrl = soundcloudUrl;
      }

      await config.save();

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('Error updating site configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update site configuration',
      });
    }
  }
);

module.exports = router;

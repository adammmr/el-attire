const Measurement = require('../models/Measurement');
const User = require('../models/User');

class MeasurementController {

  // Get all measurements for current user
  async getMyMeasurements(req, res) {
    try {
      const measurements = await Measurement.find({ 
        user: req.session.user._id,
        isActive: true 
      }).sort({ isDefault: -1, updatedAt: -1 }).lean();

      const stats = await Measurement.getUserStats(req.session.user._id);

      res.render('public/measurements', {
        title: 'My Measurements',
        measurements,
        stats,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Get Measurements Error:', error);
      req.session.error = 'Error loading measurements';
      res.redirect('/profile');
    }
  }

  // Create new measurement
  async create(req, res) {
    try {
      const {
        profileName, description, gender, bodyType, height, weight,
        upperBody, midBody, lowerBody, additional,
        fittingPreferences, posture, bestFor, generalNotes, unitSystem
      } = req.body;

      // Check if this should be default
      const existingCount = await Measurement.countDocuments({ user: req.session.user._id });
      const isDefault = existingCount === 0 || req.body.isDefault === 'on';

      const measurement = await Measurement.create({
        user: req.session.user._id,
        profileName: profileName || 'New Profile',
        description,
        gender: gender || 'male',
        bodyType: bodyType || 'average',
        height: height ? JSON.parse(height) : undefined,
        weight: weight ? JSON.parse(weight) : undefined,
        upperBody: upperBody ? JSON.parse(upperBody) : {},
        midBody: midBody ? JSON.parse(midBody) : {},
        lowerBody: lowerBody ? JSON.parse(lowerBody) : {},
        additional: additional ? JSON.parse(additional) : {},
        fittingPreferences: fittingPreferences ? JSON.parse(fittingPreferences) : {},
        posture: posture ? JSON.parse(posture) : {},
        bestFor: bestFor ? JSON.parse(bestFor) : { styles: [], occasions: [] },
        generalNotes,
        unitSystem: unitSystem || 'imperial',
        isDefault,
        measuredBy: {
          method: 'self',
          date: new Date()
        },
        history: [{
          date: new Date(),
          changes: { created: true },
          method: 'self',
          notes: 'Initial measurement created'
        }]
      });

      req.session.success = `Measurement profile "${measurement.profileName}" created`;
      res.redirect('/measurements');
    } catch (error) {
      console.error('Create Measurement Error:', error);
      req.session.error = 'Error saving measurements: ' + error.message;
      res.redirect('/measurements');
    }
  }

  // Update measurement
  async update(req, res) {
    try {
      const measurement = await Measurement.findOne({
        _id: req.params.id,
        user: req.session.user._id
      });

      if (!measurement) {
        req.session.error = 'Measurement not found';
        return res.redirect('/measurements');
      }

      const oldValues = measurement.toFlatObject();

      // Update fields
      const updateFields = [
        'profileName', 'description', 'gender', 'bodyType', 'generalNotes', 'unitSystem'
      ];
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) measurement[field] = req.body[field];
      });

      // Update complex objects
      if (req.body.height) measurement.height = JSON.parse(req.body.height);
      if (req.body.weight) measurement.weight = JSON.parse(req.body.weight);
      if (req.body.upperBody) measurement.upperBody = JSON.parse(req.body.upperBody);
      if (req.body.midBody) measurement.midBody = JSON.parse(req.body.midBody);
      if (req.body.lowerBody) measurement.lowerBody = JSON.parse(req.body.lowerBody);
      if (req.body.additional) measurement.additional = JSON.parse(req.body.additional);
      if (req.body.fittingPreferences) measurement.fittingPreferences = JSON.parse(req.body.fittingPreferences);
      if (req.body.posture) measurement.posture = JSON.parse(req.body.posture);
      if (req.body.bestFor) measurement.bestFor = JSON.parse(req.body.bestFor);

      if (req.body.isDefault === 'on') {
        measurement.isDefault = true;
      }

      // Track changes
      const newValues = measurement.toFlatObject();
      const changes = {};
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes[key] = { from: oldValues[key], to: newValues[key] };
        }
      });

      if (Object.keys(changes).length > 0) {
        measurement.history.push({
          date: new Date(),
          changes,
          method: req.body.measurementMethod || 'self',
          notes: req.body.changeNotes || 'Measurement updated'
        });
      }

      await measurement.save();

      req.session.success = `"${measurement.profileName}" updated successfully`;
      
      // If AJAX request, return JSON
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, measurement });
      }
      
      res.redirect('/measurements');
    } catch (error) {
      console.error('Update Measurement Error:', error);
      req.session.error = 'Error updating measurements';
      res.redirect('/measurements');
    }
  }

  // Delete measurement
  async delete(req, res) {
    try {
      const measurement = await Measurement.findOneAndDelete({
        _id: req.params.id,
        user: req.session.user._id
      });

      if (!measurement) {
        req.session.error = 'Measurement not found';
        return res.redirect('/measurements');
      }

      // If deleted was default, set another as default
      if (measurement.isDefault) {
        const nextDefault = await Measurement.findOne({ user: req.session.user._id });
        if (nextDefault) {
          nextDefault.isDefault = true;
          await nextDefault.save();
        }
      }

      req.session.success = 'Measurement profile deleted';
      res.redirect('/measurements');
    } catch (error) {
      console.error('Delete Measurement Error:', error);
      req.session.error = 'Error deleting measurement';
      res.redirect('/measurements');
    }
  }

  // Set as default
  async setDefault(req, res) {
    try {
      const measurement = await Measurement.findOne({
        _id: req.params.id,
        user: req.session.user._id
      });

      if (!measurement) {
        return res.status(404).json({ error: 'Not found' });
      }

      measurement.isDefault = true;
      await measurement.save();

      res.json({ success: true, message: 'Set as default measurement' });
    } catch (error) {
      console.error('Set Default Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Compare two measurements
  async compare(req, res) {
    try {
      const { id1, id2 } = req.params;

      const [m1, m2] = await Promise.all([
        Measurement.findOne({ _id: id1, user: req.session.user._id }),
        Measurement.findOne({ _id: id2, user: req.session.user._id })
      ]);

      if (!m1 || !m2) {
        req.session.error = 'Measurements not found';
        return res.redirect('/measurements');
      }

      const differences = m1.compareWith(m2);

      res.render('public/measurements-compare', {
        title: 'Compare Measurements',
        measurement1: m1,
        measurement2: m2,
        differences,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Compare Error:', error);
      res.redirect('/measurements');
    }
  }

  // Get measurements for a specific style (AJAX)
  async getForStyle(req, res) {
    try {
      const { style } = req.params;
      const measurements = await Measurement.findForStyle(req.session.user._id, style);
      res.json({ success: true, measurements });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Professional measurement (admin/tailor)
  async professionalMeasure(req, res) {
    try {
      const { userId } = req.params;
      const measurement = await Measurement.create({
        user: userId,
        profileName: req.body.profileName || 'Professional Measurement',
        ...req.body,
        measuredBy: {
          user: req.session.user._id,
          method: req.body.method || 'in_studio',
          location: req.body.location,
          date: new Date()
        },
        isVerified: true,
        verifiedBy: req.session.user._id,
        verifiedAt: new Date(),
        history: [{
          date: new Date(),
          changes: { professionally_measured: true },
          measuredBy: req.session.user._id,
          method: req.body.method || 'in_studio',
          notes: 'Professionally measured'
        }]
      });

      res.json({ success: true, measurement });
    } catch (error) {
      console.error('Professional Measure Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Export measurements
  async exportMeasurements(req, res) {
    try {
      const measurements = await Measurement.find({ user: req.session.user._id, isActive: true }).lean();
      
      const data = measurements.map(m => ({
        profileName: m.profileName,
        description: m.description,
        gender: m.gender,
        bodyType: m.bodyType,
        bestFor: m.bestFor?.styles?.join(', ') || 'General',
        measurements: m.toFlatObject(),
        updatedAt: m.updatedAt
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=measurements-export.json');
      res.json(data);
    } catch (error) {
      console.error('Export Error:', error);
      req.session.error = 'Error exporting measurements';
      res.redirect('/measurements');
    }
  }
}

module.exports = new MeasurementController();
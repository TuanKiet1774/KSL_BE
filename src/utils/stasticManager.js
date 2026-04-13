const Stastic = require("../models/Stastic");

const updateStastic = async (field, change) => {
  try {
    await Stastic.findOneAndUpdate(
      {},
      { $inc: { [field]: change } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`Error updating stastic for ${field}:`, error.message);
  }
};

module.exports = { updateStastic };

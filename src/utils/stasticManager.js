const Stastic = require("../models/Stastic");

const updateStastic = async (field, change) => {
  try {
    // Luôn đảm bảo chỉ có 1 bản ghi duy nhất trong collection Stastic
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

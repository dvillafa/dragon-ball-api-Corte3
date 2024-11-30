const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  race: {
    type: String,
    required: true
  },
  techniques: {
    type: [String],
    validate: [arrayLimit, 'El personaje no puede tener más de 3 técnicas']
  },
  specialAbilities: {
    type: [String],
    validate: [arrayLimitSpecial, 'El personaje no puede tener más de 2 habilidades especiales']
  },
  transformations: [String],
}, {
  timestamps: true
});

// Validador para las técnicas
function arrayLimit(val) {
  return val.length <= 3;
}

// Validador para las habilidades especiales
function arrayLimitSpecial(val) {
  return val.length <= 2;
}

const Character = mongoose.model('Character', characterSchema);

module.exports = Character;

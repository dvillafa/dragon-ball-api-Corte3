const express = require('express');
const Character = require('../models/Character');
const authMiddleware = require('../middleware/auth');

// Exportar una función que reciba `io`
module.exports = (io) => {
  const router = express.Router();

  // Obtener todos los personajes con paginación, filtros y búsqueda avanzada
  router.get('/', async (req, res) => {
    try {
      // Parámetros de consulta
      const { page = 1, limit = 10, name, race, technique, sortBy = 'name', sortOrder = 'asc' } = req.query;

      // Construir el filtro dinámico
      const filters = {};
      if (name) filters.name = new RegExp(name, 'i'); // Búsqueda insensible a mayúsculas/minúsculas
      if (race) filters.race = race;
      if (technique) filters.techniques = { $in: [technique] }; // Buscar por técnica

      // Ordenamiento
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Calcular paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalCharacters = await Character.countDocuments(filters);
      const characters = await Character.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Responder con datos paginados
      res.json({
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCharacters / limit),
        totalCharacters,
        characters,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Obtener un personaje por ID (No requiere autenticación)
  router.get('/:id', async (req, res) => {
    try {
      const character = await Character.findById(req.params.id);
      if (character == null) {
        return res.status(404).json({ message: 'Personaje no encontrado' });
      }
      res.json(character);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Crear un nuevo personaje (Requiere autenticación)
  // Crear un nuevo personaje (Requiere autenticación)
  router.post('/', authMiddleware, async (req, res) => {
    const { name, race, techniques, specialAbilities, transformations } = req.body;
    const character = new Character({
      name,
      race,
      techniques,
      specialAbilities,
      transformations,
    });

    try {
      const newCharacter = await character.save();
      res.status(201).json(newCharacter);

      // Emitir evento de Socket.IO cuando se cree un nuevo personaje
      io.emit('newCharacter', newCharacter);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Actualizar un personaje (Requiere autenticación)
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const character = await Character.findById(req.params.id);
      if (character == null) {
        return res.status(404).json({ message: 'Personaje no encontrado' });
      }

      if (req.body.name != null) character.name = req.body.name;
      if (req.body.race != null) character.race = req.body.race;
      if (req.body.techniques != null) character.techniques = req.body.techniques;
      if (req.body.specialAbilities != null) character.specialAbilities = req.body.specialAbilities;
      if (req.body.transformations != null) character.transformations = req.body.transformations;

      const updatedCharacter = await character.save();
      res.json(updatedCharacter);

      // Emitir evento de Socket.IO cuando se actualice un personaje
      io.emit('updatedCharacter', updatedCharacter);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });


  // Eliminar un personaje (Requiere autenticación)
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const character = await Character.findById(req.params.id);
      if (character == null) {
        return res.status(404).json({ message: 'Personaje no encontrado' });
      }

      await character.deleteOne();  // Eliminar el personaje
      res.json({ message: 'Personaje eliminado' });

      // Emitir evento de Socket.IO cuando se elimine un personaje, incluyendo su nombre
      io.emit('deletedCharacter', { id: req.params.id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};

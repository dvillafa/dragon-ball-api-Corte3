const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validar que ambos campos estén presentes
  if (!username || !password) {
    return res.status(400).json({ message: 'Error: Se requiere un nombre de usuario y una contraseña.' });
  }

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente', user: savedUser });
  } catch (error) {
    // Manejar error de duplicado
    if (error.code === 11000) {
      // El código 11000 indica un error de clave duplicada en MongoDB
      return res.status(400).json({ message: 'Error: El nombre de usuario ya está en uso.' });
    }

    // Otros errores
    res.status(500).json({ message: error.message });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const isPasswordValid = user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Crear un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un usuario por ID
router.delete('/delete/:id', async (req, res) => {
  try {
    // Buscar y eliminar el usuario por su ID
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

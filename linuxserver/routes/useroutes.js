const express = require('express');
const router = express.Router();
const { uploadMiddleware } = require('../model/user.js');
const {userController} = require("../model/user.js");

router.post('/api/users', uploadMiddleware, userController.createUser);
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);
router.put('/api/users/:id', uploadMiddleware, userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users/:id/profile-picture', userController.getProfilePicture);

module.exports = router;

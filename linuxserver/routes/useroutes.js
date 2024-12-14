const express = require('express');
const router = express.Router();
const { uploadMiddleware } = require('../model/user.js');
const { userController } = require("../model/user.js");

// Middleware to add localStorage polyfill for server-side usage
const localStoragePolyfill = (req, res, next) => {
    if (typeof localStorage === "undefined" || localStorage === null) {
        const LocalStorage = require('node-localstorage').LocalStorage;
        global.localStorage = new LocalStorage('./scratch');
    }
    next();
};

// Apply localStorage polyfill to all routes
router.use(localStoragePolyfill);

router.post('/api/users', uploadMiddleware, userController.createUser);
router.get('/api/users', userController.getAllUsers);
router.get('/api/users/:id', userController.getUserById);
router.put('/api/users/:id', uploadMiddleware, userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users/:id/profile-picture', userController.getProfilePicture);

module.exports = router;
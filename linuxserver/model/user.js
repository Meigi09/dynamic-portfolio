const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-config');
const path = require('path');
const fs = require('fs').promises;

const User = sequelize.define('User', {
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: true
        }
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    profession: {
        type: DataTypes.STRING,
        allowNull: true
    },
    skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    projects: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    socials: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'users',
    timestamps: true
});

// Middleware to handle file upload
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profile-pictures');

        // Ensure the directory exists
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err, uploadDir));
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
    }
});

// File filter to validate image uploads
const fileFilter = (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// User controller with file upload
// User controller with CRUD operations
const userController = {
    createUser: async (req, res) => {
        try {
            const skills = req.body.skills ? JSON.parse(req.body.skills) : [];
            const projects = req.body.projects ? JSON.parse(req.body.projects) : [];
            const socials = req.body.socials ? JSON.parse(req.body.socials) : [];

            const userData = {
                fullName: req.body.fullName,
                profession: req.body.profession || null,
                skills: skills,
                projects: projects,
                socials: socials,
                profilePicture: req.file ? req.file.filename : null
            };

            const user = await User.create(userData);
            res.status(201).json(user);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                message: 'Error creating user',
                error: error.message
            });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                message: 'Error fetching users',
                error: error.message
            });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({
                message: 'Error fetching user',
                error: error.message
            });
        }
    },

    updateUser: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const updatedData = {
                fullName: req.body.fullName || user.fullName,
                profession: req.body.profession || user.profession,
                skills: req.body.skills ? JSON.parse(req.body.skills) : user.skills,
                projects: req.body.projects ? JSON.parse(req.body.projects) : user.projects,
                socials: req.body.socials ? JSON.parse(req.body.socials) : user.socials,
                profilePicture: req.file ? req.file.filename : user.profilePicture
            };

            await user.update(updatedData);
            res.status(200).json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                message: 'Error updating user',
                error: error.message
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Delete associated profile picture if it exists
            if (user.profilePicture) {
                const picturePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
                await fs.unlink(picturePath).catch(err => console.error('Error deleting profile picture:', err));
            }

            await user.destroy();
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({
                message: 'Error deleting user',
                error: error.message
            });
        }
    },

    getProfilePicture: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user || !user.profilePicture) {
                return res.status(404).send('Profile picture not found');
            }

            const picturePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
            res.sendFile(picturePath);
        } catch (error) {
            console.error('Error retrieving profile picture:', error);
            res.status(500).json({
                message: 'Error retrieving profile picture',
                error: error.message
            });
        }
    }
};

// Express route setup
module.exports = {
    User,
    userController,
    uploadMiddleware: upload.single('profilePicture')
};

// Sync the model with the database
User.sync({ alter: true })
    .then(() => console.log('User table created or updated'))
    .catch(error => console.error('Error creating User table:', error));
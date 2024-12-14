const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// User class to manage file-based storage operations
class UserStorageManager {
    constructor(storageDir = path.join(__dirname, '..', 'storage')) {
        this.usersFilePath = path.join(storageDir, 'users.json');
        this.profilePicturesDir = path.join(storageDir, 'profile-pictures');
        
        // Ensure storage directories exist
        fs.mkdir(storageDir, { recursive: true });
        fs.mkdir(this.profilePicturesDir, { recursive: true });
    }

    // Read users from JSON file
    async getAllUsers() {
        try {
            const usersStr = await fs.readFile(this.usersFilePath, 'utf8');
            return JSON.parse(usersStr || '[]');
        } catch (error) {
            // If file doesn't exist, return empty array
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    // Get a specific user by ID
    async getUserById(id) {
        const users = await this.getAllUsers();
        return users.find(user => user.id === id);
    }

    // Create a new user
    async createUser(userData) {
        const users = await this.getAllUsers();
        const newUser = {
            ...userData,
            id: uuidv4(), // Generate a unique ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2));
        return newUser;
    }

    // Update an existing user
    async updateUser(id, updatedData) {
        const users = await this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Merge existing user data with updated data
        users[userIndex] = {
            ...users[userIndex],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2));
        return users[userIndex];
    }

    // Delete a user
    async deleteUser(id) {
        let users = await this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Remove profile picture if exists
        const user = users[userIndex];
        if (user.profilePicture) {
            const picturePath = path.join(this.profilePicturesDir, user.profilePicture);
            try {
                await fs.unlink(picturePath);
            } catch (error) {
                // Ignore if file doesn't exist
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        }

        // Remove user from users array
        users = users.filter(user => user.id !== id);
        await fs.writeFile(this.usersFilePath, JSON.stringify(users, null, 2));
    }

    // Handle profile picture upload
    async uploadProfilePicture(file) {
        // Validate file is an image
        if (!file.mimetype.startsWith('image/')) {
            throw new Error('Not an image! Please upload an image.');
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File too large. Maximum size is 10MB.');
        }

        // Generate unique filename
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        const filePath = path.join(this.profilePicturesDir, uniqueFilename);

        // Write file to disk
        await fs.writeFile(filePath, file.buffer);

        return uniqueFilename;
    }

    // Retrieve profile picture
    async getProfilePicture(filename) {
        const filePath = path.join(this.profilePicturesDir, filename);
        try {
            return await fs.readFile(filePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
}

// Express route handler using the UserStorageManager
const userController = {
    createUser: async (req, res) => {
        try {
            const userStorageManager = new UserStorageManager();
            
            // Parse JSON fields
            const skills = req.body.skills ? JSON.parse(req.body.skills) : [];
            const projects = req.body.projects ? JSON.parse(req.body.projects) : [];
            const socials = req.body.socials ? JSON.parse(req.body.socials) : [];

            // Prepare user data
            const userData = {
                fullName: req.body.fullName,
                profession: req.body.profession || null,
                skills: skills,
                projects: projects,
                socials: socials,
                profilePicture: req.file ? await userStorageManager.uploadProfilePicture(req.file) : null
            };

            // Create user
            const user = await userStorageManager.createUser(userData);
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
            const userStorageManager = new UserStorageManager();
            const users = await userStorageManager.getAllUsers();
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
            const userStorageManager = new UserStorageManager();
            const user = await userStorageManager.getUserById(req.params.id);
            
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
            const userStorageManager = new UserStorageManager();
            const existingUser = await userStorageManager.getUserById(req.params.id);
            
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            const updatedData = {
                fullName: req.body.fullName || existingUser.fullName,
                profession: req.body.profession || existingUser.profession,
                skills: req.body.skills ? JSON.parse(req.body.skills) : existingUser.skills,
                projects: req.body.projects ? JSON.parse(req.body.projects) : existingUser.projects,
                socials: req.body.socials ? JSON.parse(req.body.socials) : existingUser.socials,
                profilePicture: req.file 
                    ? await userStorageManager.uploadProfilePicture(req.file) 
                    : existingUser.profilePicture
            };

            const updatedUser = await userStorageManager.updateUser(req.params.id, updatedData);
            res.status(200).json(updatedUser);
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
            const userStorageManager = new UserStorageManager();
            await userStorageManager.deleteUser(req.params.id);
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
            const userStorageManager = new UserStorageManager();
            const user = await userStorageManager.getUserById(req.params.id);
            
            if (!user || !user.profilePicture) {
                return res.status(404).send('Profile picture not found');
            }

            const pictureData = await userStorageManager.getProfilePicture(user.profilePicture);
            
            if (!pictureData) {
                return res.status(404).send('Profile picture not found');
            }

            // Set content type based on file extension
            const ext = path.extname(user.profilePicture).toLowerCase();
            switch (ext) {
                case '.png':
                    res.contentType('image/png');
                    break;
                case '.jpg':
                case '.jpeg':
                    res.contentType('image/jpeg');
                    break;
                case '.gif':
                    res.contentType('image/gif');
                    break;
                default:
                    res.contentType('application/octet-stream');
            }

            res.send(pictureData);
        } catch (error) {
            console.error('Error retrieving profile picture:', error);
            res.status(500).json({
                message: 'Error retrieving profile picture',
                error: error.message
            });
        }
    }
};

// Multer configuration remains the same
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = {
    userController,
    uploadMiddleware: upload.single('profilePicture')
};
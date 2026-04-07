const { body, validationResult } = require('express-validator');

// Validation rules for room creation
const validateRoomCreation = [
    body('roomId')
        .notEmpty().withMessage('Room ID is required.')
        .isString().withMessage('Room ID must be a string.'),
    body('roomName')
        .notEmpty().withMessage('Room Name is required.')
        .isString().withMessage('Room Name must be a string.')
        .isLength({ min: 3, max: 30 }).withMessage('Room Name must be between 3 and 30 characters.'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Errors:", errors.array());
        return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRoomCreation,
    handleValidationErrors
};

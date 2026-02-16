/**
 * F-06: Input Validation Middleware
 * Lexora Library Management System
 * 
 * Uses the 'validator' package already installed in package.json.
 * Applied as middleware on each route before the controller runs.
 */

const validator = require('validator');

// ── Helpers ───────────────────────────────────────────────────────────────────

const isValidId = (val) => /^\d+$/.test(String(val)) && parseInt(val) > 0;

const isValidYear = (val) => {
  const year = parseInt(val);
  return !isNaN(year) && year >= 1000 && year <= new Date().getFullYear() + 1;
};

const isValidISBN = (val) => {
  const clean = String(val).replace(/-/g, '');
  return /^(\d{10}|\d{13})$/.test(clean);
};

const isValidDate = (val) => {
  const d = new Date(val);
  return !isNaN(d.getTime());
};

// Returns a 400 response with a list of validation errors
const fail = (res, errors) => res.status(400).json({
  success: false,
  message: errors[0],   // first error as main message
  errors,
  code: 'VALIDATION_ERROR',
});

// ── AUTH VALIDATORS ───────────────────────────────────────────────────────────

const validateLogin = (req, res, next) => {
  const errors = [];
  const { username, password } = req.body;

  if (!username || typeof username !== 'string')
    errors.push('Username is required');
  else if (username.trim().length < 3 || username.trim().length > 50)
    errors.push('Username must be between 3 and 50 characters');
  else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim()))
    errors.push('Username may only contain letters, numbers, underscores, dots, and hyphens');

  if (!password || typeof password !== 'string')
    errors.push('Password is required');
  else if (password.length < 1 || password.length > 128)
    errors.push('Password must be between 1 and 128 characters');

  if (errors.length) return fail(res, errors);

  // Sanitize
  req.body.username = username.trim().toLowerCase();
  next();
};

const validateUpdateProfile = (req, res, next) => {
  const errors = [];
  const { fullName, username } = req.body;

  if (!fullName || typeof fullName !== 'string')
    errors.push('Full name is required');
  else if (fullName.trim().length < 2 || fullName.trim().length > 100)
    errors.push('Full name must be between 2 and 100 characters');

  if (!username || typeof username !== 'string')
    errors.push('Username is required');
  else if (username.trim().length < 3 || username.trim().length > 50)
    errors.push('Username must be between 3 and 50 characters');
  else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim()))
    errors.push('Username may only contain letters, numbers, underscores, dots, and hyphens');

  if (errors.length) return fail(res, errors);

  req.body.fullName  = fullName.trim();
  req.body.username  = username.trim().toLowerCase();
  next();
};

const validateUpdatePassword = (req, res, next) => {
  const errors = [];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string')
    errors.push('Current password is required');

  if (!newPassword || typeof newPassword !== 'string')
    errors.push('New password is required');
  else if (newPassword.length < 12)
    errors.push('New password must be at least 12 characters');
  else if (newPassword.length > 128)
    errors.push('New password must not exceed 128 characters');

  if (errors.length) return fail(res, errors);
  next();
};

// ── BOOK VALIDATORS ───────────────────────────────────────────────────────────

const validateBookId = (req, res, next) => {
  if (!isValidId(req.params.id))
    return fail(res, ['Book ID must be a positive integer']);
  req.params.id = parseInt(req.params.id);
  next();
};

// F-09 FIX: strict ISBN format validation before hitting Google Books API
const validateISBN = (req, res, next) => {
  const { isbn } = req.params;
  if (!isbn || !isValidISBN(isbn))
    return fail(res, ['ISBN must be a valid 10 or 13 digit number (hyphens allowed)']);
  req.params.isbn = isbn.replace(/-/g, ''); // strip hyphens for clean API call
  next();
};

const validateBookSearch = (req, res, next) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length === 0)
    return fail(res, ['Search query is required']);
  if (q.trim().length > 200)
    return fail(res, ['Search query must not exceed 200 characters']);
  req.query.q = q.trim();
  next();
};

const validateCreateBook = (req, res, next) => {
  const errors = [];
  const {
    title, author, isbn, quantity,
    cover_image, published_year, email
  } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0)
    errors.push('Title is required');
  else if (title.trim().length > 255)
    errors.push('Title must not exceed 255 characters');

  if (!author || typeof author !== 'string' || author.trim().length === 0)
    errors.push('Author is required');
  else if (author.trim().length > 255)
    errors.push('Author must not exceed 255 characters');

  if (!isbn || typeof isbn !== 'string')
    errors.push('ISBN is required');
  else if (!isValidISBN(isbn))
    errors.push('ISBN must be a valid 10 or 13 digit number');

  if (quantity !== undefined) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10000)
      errors.push('Quantity must be a number between 1 and 10000');
  }

  if (published_year !== undefined && published_year !== '' && published_year !== null) {
    if (!isValidYear(published_year))
      errors.push('Published year must be a valid year');
  }

  if (cover_image && typeof cover_image === 'string' && cover_image.trim() !== '') {
    if (!validator.isURL(cover_image.trim(), { protocols: ['http', 'https'], require_protocol: true }))
      errors.push('Cover image must be a valid HTTP/HTTPS URL');
  }

  if (errors.length) return fail(res, errors);

  // Sanitize
  req.body.title   = title.trim();
  req.body.author  = author.trim();
  req.body.isbn    = isbn.replace(/-/g, '');
  if (req.body.category)    req.body.category    = req.body.category.trim();
  if (req.body.publisher)   req.body.publisher   = req.body.publisher.trim();
  if (req.body.location)    req.body.location    = req.body.location.trim();
  if (req.body.description) req.body.description = req.body.description.trim();
  next();
};

const validateUpdateBook = (req, res, next) => {
  if (!isValidId(req.params.id))
    return fail(res, ['Book ID must be a positive integer']);
  req.params.id = parseInt(req.params.id);
  return validateCreateBook(req, res, next);
};

// ── TRANSACTION VALIDATORS ────────────────────────────────────────────────────

const validateTransactionId = (req, res, next) => {
  if (!isValidId(req.params.id))
    return fail(res, ['Transaction ID must be a positive integer']);
  req.params.id = parseInt(req.params.id);
  next();
};

const validateCreateTransaction = (req, res, next) => {
  const errors = [];
  const {
    book_id, student_name, student_id_number,
    borrowed_date, due_date, contact_number, email
  } = req.body;

  if (!book_id || !isValidId(book_id))
    errors.push('A valid book ID is required');

  if (!student_name || typeof student_name !== 'string' || student_name.trim().length === 0)
    errors.push('Student name is required');
  else if (student_name.trim().length > 150)
    errors.push('Student name must not exceed 150 characters');

  if (!student_id_number || typeof student_id_number !== 'string' || student_id_number.trim().length === 0)
    errors.push('Student ID number is required');
  else if (student_id_number.trim().length > 50)
    errors.push('Student ID number must not exceed 50 characters');

  if (!borrowed_date || !isValidDate(borrowed_date))
    errors.push('A valid borrow date is required');

  if (!due_date || !isValidDate(due_date))
    errors.push('A valid due date is required');

  if (borrowed_date && due_date && isValidDate(borrowed_date) && isValidDate(due_date)) {
    if (new Date(due_date) <= new Date(borrowed_date))
      errors.push('Due date must be after borrow date');
  }

  if (contact_number && typeof contact_number === 'string' && contact_number.trim() !== '') {
    if (!/^[0-9+\-\s()]{7,20}$/.test(contact_number.trim()))
      errors.push('Contact number format is invalid');
  }

  if (email && typeof email === 'string' && email.trim() !== '') {
    if (!validator.isEmail(email.trim()))
      errors.push('Email address format is invalid');
  }

  if (errors.length) return fail(res, errors);

  // Sanitize
  req.body.student_name      = student_name.trim();
  req.body.student_id_number = student_id_number.trim();
  if (req.body.course)   req.body.course   = req.body.course.trim();
  if (req.body.address)  req.body.address  = req.body.address.trim();
  if (req.body.notes)    req.body.notes    = req.body.notes.trim();
  if (email)             req.body.email    = email.trim().toLowerCase();
  next();
};

const validateExtendDueDate = (req, res, next) => {
  const errors = [];
  if (!isValidId(req.params.id))
    errors.push('Transaction ID must be a positive integer');

  const days = parseInt(req.body.days);
  if (isNaN(days) || days < 1 || days > 365)
    errors.push('Days must be a number between 1 and 365');

  if (errors.length) return fail(res, errors);

  req.params.id  = parseInt(req.params.id);
  req.body.days  = days;
  next();
};

const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length === 0)
    return fail(res, ['Search query is required']);
  if (q.trim().length > 200)
    return fail(res, ['Search query must not exceed 200 characters']);
  req.query.q = q.trim();
  next();
};

module.exports = {
  // Auth
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword,
  // Books
  validateBookId,
  validateISBN,
  validateBookSearch,
  validateCreateBook,
  validateUpdateBook,
  // Transactions
  validateTransactionId,
  validateCreateTransaction,
  validateExtendDueDate,
  validateSearchQuery,
};

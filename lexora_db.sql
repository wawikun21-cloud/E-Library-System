-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 07, 2026 at 01:18 AM
-- Server version: 8.4.7
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lexora_db`
--

DELIMITER $$
--
-- Procedures
--
DROP PROCEDURE IF EXISTS `sp_checkout_book`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkout_book` (IN `p_book_id` INT, IN `p_student_id` INT, IN `p_borrow_date` DATE, IN `p_due_date` DATE, IN `p_user_id` INT, OUT `p_transaction_number` VARCHAR(50), OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(255))   BEGIN
  DECLARE v_available INT;
  DECLARE v_transaction_count INT;
  
  -- Check if book is available
  SELECT available_quantity INTO v_available
  FROM books
  WHERE book_id = p_book_id AND is_active = TRUE;
  
  IF v_available > 0 THEN
    -- Generate transaction number
    SELECT COUNT(*) INTO v_transaction_count FROM transactions;
    SET p_transaction_number = CONCAT('T', LPAD(v_transaction_count + 1, 3, '0'));
    
    -- Insert transaction
    INSERT INTO transactions (transaction_number, book_id, student_id, borrow_date, due_date, borrowed_by_user_id)
    VALUES (p_transaction_number, p_book_id, p_student_id, p_borrow_date, p_due_date, p_user_id);
    
    -- Update book availability
    UPDATE books
    SET available_quantity = available_quantity - 1
    WHERE book_id = p_book_id;
    
    SET p_success = TRUE;
    SET p_message = 'Book checked out successfully';
  ELSE
    SET p_success = FALSE;
    SET p_message = 'Book is not available';
  END IF;
END$$

DROP PROCEDURE IF EXISTS `sp_return_book`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_return_book` (IN `p_transaction_id` INT, IN `p_return_date` DATE, IN `p_user_id` INT, OUT `p_fine_amount` DECIMAL(10,2), OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(255))   BEGIN
  DECLARE v_book_id INT;
  DECLARE v_due_date DATE;
  DECLARE v_days_overdue INT;
  DECLARE v_daily_fine DECIMAL(10,2) DEFAULT 5.00; -- $5 per day
  
  -- Get transaction details
  SELECT book_id, due_date INTO v_book_id, v_due_date
  FROM transactions
  WHERE transaction_id = p_transaction_id AND status != 'returned';
  
  IF v_book_id IS NOT NULL THEN
    -- Calculate overdue days and fine
    SET v_days_overdue = GREATEST(DATEDIFF(p_return_date, v_due_date), 0);
    SET p_fine_amount = v_days_overdue * v_daily_fine;
    
    -- Update transaction
    UPDATE transactions
    SET return_date = p_return_date,
        status = 'returned',
        fine_amount = p_fine_amount,
        returned_by_user_id = p_user_id
    WHERE transaction_id = p_transaction_id;
    
    -- Update book availability
    UPDATE books
    SET available_quantity = available_quantity + 1
    WHERE book_id = v_book_id;
    
    -- Insert fine record if overdue
    IF p_fine_amount > 0 THEN
      INSERT INTO fines (transaction_id, student_id, fine_amount, days_overdue)
      SELECT transaction_id, student_id, p_fine_amount, v_days_overdue
      FROM transactions
      WHERE transaction_id = p_transaction_id;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = 'Book returned successfully';
  ELSE
    SET p_success = FALSE;
    SET p_message = 'Transaction not found or already returned';
  END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., LOGIN, ADD_BOOK, BORROW, RETURN',
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `announcement_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Base64 encoded image or URL',
  `posted_by_user_id` int DEFAULT NULL,
  `posted_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `expiry_date` date DEFAULT NULL COMMENT 'Optional expiration date for announcements',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`announcement_id`),
  KEY `posted_by_user_id` (`posted_by_user_id`),
  KEY `idx_posted_date` (`posted_date`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `title`, `message`, `image_url`, `posted_by_user_id`, `posted_date`, `is_active`, `priority`, `expiry_date`, `created_at`, `updated_at`) VALUES
(1, 'Welcome to Lexora Library', 'Welcome to our digital library management system. Browse, borrow, and enjoy!', NULL, NULL, '2026-02-06 03:51:48', 1, 'high', NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(2, 'New Book Arrivals', 'Check out our latest collection of programming and computer science books!', NULL, NULL, '2026-02-06 03:51:48', 1, 'medium', NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(3, 'Library Hours Update', 'Please note that the library will close at 6 PM on Fridays starting next month.', NULL, NULL, '2026-02-06 03:51:48', 1, 'medium', NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE IF NOT EXISTS `appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `book_id` int NOT NULL,
  `appointment_type` enum('borrow','return') COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` datetime NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by_user_id` int DEFAULT NULL,
  `confirmed_by_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `confirmed_by_user_id` (`confirmed_by_user_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`appointment_type`),
  KEY `idx_appointment_date_status` (`appointment_date`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `student_id`, `book_id`, `appointment_type`, `appointment_date`, `status`, `notes`, `created_by_user_id`, `confirmed_by_user_id`, `created_at`, `updated_at`) VALUES
(1, 1, 6, 'borrow', '2024-02-06 14:00:00', 'pending', NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(2, 2, 7, 'return', '2024-02-06 15:30:00', 'confirmed', NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(3, 3, 8, 'borrow', '2024-02-07 10:00:00', 'pending', NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48');

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
CREATE TABLE IF NOT EXISTS `books` (
  `book_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `available_quantity` int NOT NULL DEFAULT '1',
  `cover_image` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Base64 encoded image or URL',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `published_year` year DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Shelf location',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`book_id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_title` (`title`),
  KEY `idx_author` (`author`),
  KEY `idx_isbn` (`isbn`),
  KEY `idx_category` (`category`),
  KEY `idx_book_available` (`is_active`,`available_quantity`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`book_id`, `title`, `author`, `isbn`, `quantity`, `available_quantity`, `cover_image`, `category`, `publisher`, `published_year`, `description`, `location`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 5, 4, NULL, 'Fiction', NULL, '1925', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(2, 'To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 3, 2, NULL, 'Fiction', NULL, '1960', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(3, '1984', 'George Orwell', '978-0-452-28423-4', 4, 3, NULL, 'Fiction', NULL, '1949', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(4, 'Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 3, 2, NULL, 'Classic', NULL, '0000', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(5, 'The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 2, 0, NULL, 'Fiction', NULL, '1951', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(6, 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0-262-03384-8', 4, 3, NULL, 'Computer Science', NULL, '2009', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(7, 'Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 5, 4, NULL, 'Programming', NULL, '2008', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1),
(8, 'Design Patterns', 'Erich Gamma', '978-0-201-63361-0', 3, 2, NULL, 'Software Engineering', NULL, '1994', NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48', 1);

--
-- Triggers `books`
--
DROP TRIGGER IF EXISTS `trg_log_book_insert`;
DELIMITER $$
CREATE TRIGGER `trg_log_book_insert` AFTER INSERT ON `books` FOR EACH ROW BEGIN
  INSERT INTO activity_logs (action_type, table_name, record_id, description)
  VALUES ('ADD_BOOK', 'books', NEW.book_id, CONCAT('New book added: ', NEW.title));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `fines`
--

DROP TABLE IF EXISTS `fines`;
CREATE TABLE IF NOT EXISTS `fines` (
  `fine_id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `student_id` int NOT NULL,
  `fine_amount` decimal(10,2) NOT NULL,
  `days_overdue` int NOT NULL,
  `payment_status` enum('unpaid','paid','waived') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`fine_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `student_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Student ID like S001',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` enum('1','2','3','4','Graduate') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `student_number` (`student_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_student_number` (`student_number`),
  KEY `idx_email` (`email`),
  KEY `idx_name` (`last_name`,`first_name`),
  KEY `idx_student_active` (`is_active`,`student_number`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `student_number`, `first_name`, `last_name`, `email`, `phone`, `course`, `year_level`, `address`, `registration_date`, `is_active`) VALUES
(1, 'S001', 'Alice', 'Johnson', 'alice.johnson@student.com', NULL, 'Computer Science', '3', NULL, '2026-02-06 03:51:48', 1),
(2, 'S002', 'Bob', 'Smith', 'bob.smith@student.com', NULL, 'Information Technology', '2', NULL, '2026-02-06 03:51:48', 1),
(3, 'S003', 'Charlie', 'Brown', 'charlie.brown@student.com', NULL, 'Engineering', '4', NULL, '2026-02-06 03:51:48', 1),
(4, 'S004', 'Diana', 'Prince', 'diana.prince@student.com', NULL, 'Computer Science', '1', NULL, '2026-02-06 03:51:48', 1),
(5, 'S005', 'Edward', 'Norton', 'edward.norton@student.com', NULL, 'Business', '3', NULL, '2026-02-06 03:51:48', 1);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE IF NOT EXISTS `transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Transaction ID like T001',
  `book_id` int NOT NULL,
  `student_id` int NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('active','overdue','returned') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `fine_amount` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `borrowed_by_user_id` int DEFAULT NULL COMMENT 'Librarian who processed the transaction',
  `returned_by_user_id` int DEFAULT NULL COMMENT 'Librarian who processed the return',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  UNIQUE KEY `transaction_number` (`transaction_number`),
  KEY `borrowed_by_user_id` (`borrowed_by_user_id`),
  KEY `returned_by_user_id` (`returned_by_user_id`),
  KEY `idx_transaction_number` (`transaction_number`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_borrow_date` (`borrow_date`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_transaction_status_date` (`status`,`due_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `transaction_number`, `book_id`, `student_id`, `borrow_date`, `due_date`, `return_date`, `status`, `fine_amount`, `notes`, `borrowed_by_user_id`, `returned_by_user_id`, `created_at`, `updated_at`) VALUES
(1, 'T001', 1, 1, '2024-01-15', '2024-02-15', NULL, 'active', 0.00, NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(2, 'T002', 3, 2, '2024-01-10', '2024-02-10', NULL, 'overdue', 0.00, NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(3, 'T003', 4, 3, '2024-01-20', '2024-02-20', NULL, 'active', 0.00, NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(4, 'T004', 2, 4, '2024-01-18', '2024-02-18', NULL, 'active', 0.00, NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48'),
(5, 'T005', 5, 5, '2024-01-05', '2024-02-05', NULL, 'overdue', 0.00, NULL, NULL, NULL, '2026-02-06 03:51:48', '2026-02-06 03:51:48');

--
-- Triggers `transactions`
--
DROP TRIGGER IF EXISTS `trg_update_overdue_status`;
DELIMITER $$
CREATE TRIGGER `trg_update_overdue_status` BEFORE UPDATE ON `transactions` FOR EACH ROW BEGIN
  IF NEW.status = 'active' AND NEW.due_date < CURDATE() AND OLD.status != 'returned' THEN
    SET NEW.status = 'overdue';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','librarian') COLLATE utf8mb4_unicode_ci DEFAULT 'librarian',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `email`, `role`, `created_at`, `updated_at`, `last_login`, `is_active`) VALUES
(6, 'admin', 'admin123\r\n', 'Administrator', 'admin@lexora.com', 'admin', '2026-02-06 10:38:10', '2026-02-06 10:40:12', NULL, 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_active_borrowings`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `v_active_borrowings`;
CREATE TABLE IF NOT EXISTS `v_active_borrowings` (
`author` varchar(255)
,`book_title` varchar(255)
,`borrow_date` date
,`days_remaining` int
,`due_date` date
,`isbn` varchar(20)
,`status` enum('active','overdue','returned')
,`student_email` varchar(100)
,`student_name` varchar(201)
,`student_number` varchar(50)
,`transaction_id` int
,`transaction_number` varchar(50)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_library_stats`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `v_library_stats`;
CREATE TABLE IF NOT EXISTS `v_library_stats` (
`active_borrowings` bigint
,`available_copies` decimal(32,0)
,`overdue_books` bigint
,`pending_appointments` bigint
,`total_books` bigint
,`total_copies` decimal(32,0)
,`total_students` bigint
,`total_unpaid_fines` decimal(32,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_overdue_books`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `v_overdue_books`;
CREATE TABLE IF NOT EXISTS `v_overdue_books` (
`book_title` varchar(255)
,`borrow_date` date
,`days_overdue` int
,`due_date` date
,`fine_amount` decimal(11,2)
,`isbn` varchar(20)
,`student_name` varchar(201)
,`student_number` varchar(50)
,`transaction_id` int
,`transaction_number` varchar(50)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books` ADD FULLTEXT KEY `ft_search` (`title`,`author`,`isbn`);

-- --------------------------------------------------------

--
-- Structure for view `v_active_borrowings`
--
DROP TABLE IF EXISTS `v_active_borrowings`;

DROP VIEW IF EXISTS `v_active_borrowings`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_borrowings`  AS SELECT `t`.`transaction_id` AS `transaction_id`, `t`.`transaction_number` AS `transaction_number`, `b`.`title` AS `book_title`, `b`.`author` AS `author`, `b`.`isbn` AS `isbn`, concat(`s`.`first_name`,' ',`s`.`last_name`) AS `student_name`, `s`.`student_number` AS `student_number`, `s`.`email` AS `student_email`, `t`.`borrow_date` AS `borrow_date`, `t`.`due_date` AS `due_date`, (to_days(`t`.`due_date`) - to_days(curdate())) AS `days_remaining`, `t`.`status` AS `status` FROM ((`transactions` `t` join `books` `b` on((`t`.`book_id` = `b`.`book_id`))) join `students` `s` on((`t`.`student_id` = `s`.`student_id`))) WHERE (`t`.`status` in ('active','overdue')) ;

-- --------------------------------------------------------

--
-- Structure for view `v_library_stats`
--
DROP TABLE IF EXISTS `v_library_stats`;

DROP VIEW IF EXISTS `v_library_stats`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_library_stats`  AS SELECT (select count(0) from `books` where (`books`.`is_active` = true)) AS `total_books`, (select sum(`books`.`quantity`) from `books` where (`books`.`is_active` = true)) AS `total_copies`, (select sum(`books`.`available_quantity`) from `books` where (`books`.`is_active` = true)) AS `available_copies`, (select count(0) from `students` where (`students`.`is_active` = true)) AS `total_students`, (select count(0) from `transactions` where (`transactions`.`status` = 'active')) AS `active_borrowings`, (select count(0) from `transactions` where (`transactions`.`status` = 'overdue')) AS `overdue_books`, (select count(0) from `appointments` where (`appointments`.`status` = 'pending')) AS `pending_appointments`, (select coalesce(sum(`fines`.`fine_amount`),0) from `fines` where (`fines`.`payment_status` = 'unpaid')) AS `total_unpaid_fines` ;

-- --------------------------------------------------------

--
-- Structure for view `v_overdue_books`
--
DROP TABLE IF EXISTS `v_overdue_books`;

DROP VIEW IF EXISTS `v_overdue_books`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_overdue_books`  AS SELECT `t`.`transaction_id` AS `transaction_id`, `t`.`transaction_number` AS `transaction_number`, `b`.`title` AS `book_title`, `b`.`isbn` AS `isbn`, concat(`s`.`first_name`,' ',`s`.`last_name`) AS `student_name`, `s`.`student_number` AS `student_number`, `t`.`borrow_date` AS `borrow_date`, `t`.`due_date` AS `due_date`, (to_days(curdate()) - to_days(`t`.`due_date`)) AS `days_overdue`, ((to_days(curdate()) - to_days(`t`.`due_date`)) * 5.00) AS `fine_amount` FROM ((`transactions` `t` join `books` `b` on((`t`.`book_id` = `b`.`book_id`))) join `students` `s` on((`t`.`student_id` = `s`.`student_id`))) WHERE ((`t`.`status` = 'overdue') OR ((`t`.`status` = 'active') AND (`t`.`due_date` < curdate()))) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`posted_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `fines`
--
ALTER TABLE `fines`
  ADD CONSTRAINT `fines_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`transaction_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fines_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`borrowed_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_4` FOREIGN KEY (`returned_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

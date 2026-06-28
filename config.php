<?php
declare(strict_types=1);

define('DATA_DIR', __DIR__ . '/data/');

// Admin portal password (sent as Bearer token)
define('ADMIN_PASSWORD', '123456');

// Razorpay credentials — replace with live keys before go-live
define('RAZORPAY_KEY_ID',     'rzp_live_T6j6TLGfI48b7m');
define('RAZORPAY_KEY_SECRET', 'uCm33TEOgQs5LDN7wkmC0S1b');

// SMTP / Hostinger settings
define('SMTP_HOST',       'smtp.hostinger.com');
define('SMTP_PORT',       587);
define('SMTP_USER',       'info@imbs.org.in');
define('SMTP_PASS',       'Imbs.@2025');
define('SMTP_FROM_EMAIL', 'info@imbs.org.in');
define('SMTP_FROM_NAME',  'IMBS Admissions');

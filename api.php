<?php
declare(strict_types=1);

// ─── CORS ───────────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────
require_once __DIR__ . '/config.php';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function json_ok(mixed $data): never
{
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): never
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Ensures a directory exists and is writable, with Hostinger-friendly error messages.
 * Creates the directory (0755, recursive) if it does not exist.
 */
function ensure_dir_writable(string $dir, string $label = ''): void
{
    $hint = $label ?: basename($dir);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            json_error(
                "Directory \"{$hint}/\" does not exist and could not be created automatically. "
                . "Please create it via Hostinger File Manager and set permissions to 755.",
                500
            );
        }
    }
    if (!is_writable($dir)) {
        json_error(
            "Directory \"{$hint}/\" is not writable. "
            . "Please set its permissions to 755 via Hostinger File Manager → right-click → Change Permissions.",
            500
        );
    }
}

function read_json_file(string $filename): mixed
{
    $path = DATA_DIR . $filename;
    if (!file_exists($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    return json_decode($raw, true) ?? [];
}

function write_json_file(string $filename, mixed $data): void
{
    ensure_dir_writable(DATA_DIR, 'data');
    $path   = DATA_DIR . $filename;
    $result = file_put_contents(
        $path,
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    if ($result === false) {
        json_error('Failed to write data file — disk may be full or permissions denied.', 500);
    }
}

function request_body(): mixed
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        json_error('Request body is empty', 400);
    }
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_error('Invalid JSON: ' . json_last_error_msg(), 400);
    }
    return $data;
}

// ─── SMTP MAILER ─────────────────────────────────────────────────────────────
// Reads one SMTP response (handles multi-line "250-..." continuations).
function smtp_readline($sock): string
{
    $response = '';
    while (($line = fgets($sock, 512)) !== false) {
        $response .= $line;
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    return $response;
}

function smtp_send($sock, string $cmd): string
{
    fwrite($sock, $cmd . "\r\n");
    return smtp_readline($sock);
}

function send_email(string $to, string $subject, string $html_body): bool
{
    $errno  = 0;
    $errstr = '';
    $sock   = @fsockopen('tcp://' . SMTP_HOST, SMTP_PORT, $errno, $errstr, 15);
    if (!$sock) {
        return false;
    }

    stream_set_timeout($sock, 15);
    smtp_readline($sock);                         // server greeting

    smtp_send($sock, 'EHLO localhost');
    smtp_send($sock, 'STARTTLS');

    if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)) {
        fclose($sock);
        return false;
    }

    smtp_send($sock, 'EHLO localhost');
    smtp_send($sock, 'AUTH LOGIN');
    smtp_send($sock, base64_encode(SMTP_USER));
    smtp_send($sock, base64_encode(SMTP_PASS));

    smtp_send($sock, 'MAIL FROM:<' . SMTP_FROM_EMAIL . '>');
    smtp_send($sock, 'RCPT TO:<' . $to . '>');
    smtp_send($sock, 'DATA');

    $from = SMTP_FROM_EMAIL;
    $name = SMTP_FROM_NAME;

    $message = "From: {$name} <{$from}>\r\n"
             . "To: {$to}\r\n"
             . "Subject: {$subject}\r\n"
             . "MIME-Version: 1.0\r\n"
             . "Content-Type: text/html; charset=UTF-8\r\n"
             . "\r\n"
             . $html_body
             . "\r\n.";

    smtp_send($sock, $message);
    smtp_send($sock, 'QUIT');
    fclose($sock);

    return true;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
// Clients send:  Authorization: Bearer Admin@IMBS2026
$is_admin = false;

$auth_header = $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '');

if (preg_match('/^Bearer\s+(.+)$/i', trim((string) $auth_header), $matches)) {
    $incoming_token = $matches[1];
    $admin_hash     = password_hash(ADMIN_PASSWORD, PASSWORD_BCRYPT);
    $is_admin       = password_verify($incoming_token, $admin_hash);
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$action = trim($_GET['action'] ?? '');

switch ($action) {

    // ── Public GET endpoints ─────────────────────────────────────────────────

    case 'get_courses':
        json_ok(read_json_file('courses.json'));

    case 'get_categories':
        json_ok(read_json_file('categories.json'));

    case 'get_accreditations':
        json_ok(read_json_file('accreditations.json'));

    case 'get_partners':
        json_ok(read_json_file('partners.json'));

    case 'get_razorpay_key':
        json_ok(['key_id' => RAZORPAY_KEY_ID]);

    // ── Public POST: lead / inquiry submission ────────────────────────────────

    case 'save_lead':
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $lead = request_body();
        if (!is_array($lead)) {
            json_error('Lead data must be a JSON object', 400);
        }
        $lead['timestamp'] = (new DateTimeImmutable())->format(DateTimeInterface::ATOM);
        $leads             = read_json_file('leads.json');
        $leads[]           = $lead;
        write_json_file('leads.json', $leads);
        json_ok(['success' => true, 'message' => 'Inquiry submitted successfully']);

    // ── Admin POST: secure file upload ───────────────────────────────────────
    // Accepts multipart/form-data with field name "file".
    // Images  → images/    PDF brochures → brochure/

    case 'upload_file':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $upload_errors = [
                UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on server',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            ];
            $err_code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
            json_error($upload_errors[$err_code] ?? 'Unknown upload error', 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($_FILES['file']['tmp_name']);

        $allowed_images = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];

        // Allow a named destination for hero video upload
        $dest_name = isset($_POST['dest_name']) ? preg_replace('/[^a-z0-9_\-\.]/i', '', $_POST['dest_name']) : '';

        if (isset($allowed_images[$mime])) {
            $upload_dir = __DIR__ . '/images/';
            $url_folder = 'images';
            $ext        = $allowed_images[$mime];
        } elseif ($mime === 'application/pdf') {
            $upload_dir = __DIR__ . '/brochure/';
            $url_folder = 'brochure';
            $ext        = 'pdf';
        } elseif (in_array($mime, ['video/mp4', 'video/webm', 'video/ogg'], true)) {
            $upload_dir = __DIR__ . '/uploads/';
            $url_folder = 'uploads';
            $ext        = $mime === 'video/webm' ? 'webm' : ($mime === 'video/ogg' ? 'ogv' : 'mp4');
        } else {
            json_error('File type not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF, MP4.', 400);
        }

        ensure_dir_writable($upload_dir, $url_folder);

        // For named destinations (e.g. hero-bg.mp4), use the fixed filename directly
        $filename = ($dest_name !== '')
            ? basename($dest_name) . '.' . $ext
            : bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
        $dest     = $upload_dir . $filename;

        if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
            json_error('Failed to move uploaded file', 500);
        }

        json_ok(['success' => true, 'path' => $url_folder . '/' . $filename]);

    case 'admin_reset_student_password':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $new_pass = trim((string)($body['password'] ?? ''));
        if (!$email || !$new_pass) {
            json_error('Email and new password are required', 400);
        }
        $students = read_json_file('students.json');
        $found = false;
        foreach ($students as &$student) {
            if (strtolower(trim($student['email'])) === $email) {
                $student['password'] = password_hash($new_pass, PASSWORD_BCRYPT);
                $student['temp_password'] = $new_pass;
                $found = true;
                break;
            }
        }
        if (!$found) {
            json_error('Student not found', 404);
        }
        write_json_file('students.json', $students);
        json_ok(['success' => true, 'message' => 'Student password updated successfully']);

    case 'admin_change_own_password':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        $new_pass = trim((string)($body['password'] ?? ''));
        if (!$new_pass) {
            json_error('New password is required', 400);
        }
        $config_file = __DIR__ . '/config.php';
        $content = file_get_contents($config_file);
        $pattern = "/define\('ADMIN_PASSWORD',\s*'[^']+'\);/";
        $replacement = "define('ADMIN_PASSWORD', '" . addslashes($new_pass) . "');";
        $new_content = preg_replace($pattern, $replacement, $content);
        if ($new_content === null || $new_content === $content) {
            json_error('Failed to update config.php', 500);
        }
        if (file_put_contents($config_file, $new_content) === false) {
            json_error('Failed to write to config.php', 500);
        }
        json_ok(['success' => true, 'message' => 'Admin password updated successfully']);

    // ── Public POST: record Razorpay payment + auto-register student ─────────

    case 'save_payment':
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }

        $body = request_body();
        if (!is_array($body)) {
            json_error('Request body must be a JSON object', 400);
        }

        foreach (['payment_id', 'name', 'email', 'course', 'amount'] as $field) {
            if (empty($body[$field])) {
                json_error("Missing required field: {$field}", 400);
            }
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            json_error('Invalid email address', 400);
        }

        $payment = [
            'payment_id'     => (string) $body['payment_id'],
            'name'           => (string) $body['name'],
            'email'          => strtolower(trim((string) $body['email'])),
            'phone'          => (string) ($body['phone'] ?? ''),
            'course'         => (string) $body['course'],
            'amount'         => (int) $body['amount'],
            'currency'       => strtoupper((string) ($body['currency'] ?? 'INR')),
            'timestamp'      => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
            'city'           => (string) ($body['city'] ?? ''),
            'counselor'      => (string) ($body['counselor'] ?? ''),
            'admission_type' => (string) ($body['admission_type'] ?? ''),
            'enrollment_no'  => (string) ($body['enrollment_no'] ?? ''),
            'remarks'        => (string) ($body['remarks'] ?? ''),
        ];

        // Persist payment record
        $payments   = read_json_file('payments.json');
        $payments[] = $payment;
        write_json_file('payments.json', $payments);

        // Auto-register student (idempotent — skip if email already enrolled)
        $students      = read_json_file('students.json');
        $known_emails  = array_column($students, 'email');
        $temp_password = null;

        if (!in_array($payment['email'], $known_emails, true)) {
            // Generate a memorable temporary password: FirstName@4-digits
            $first_name    = ucfirst(strtolower(explode(' ', trim($payment['name']))[0]));
            $temp_password = $first_name . '@' . random_int(1000, 9999);

            $students[] = [
                'email'         => $payment['email'],
                'username'      => $payment['email'],
                'name'          => $payment['name'],
                'password'      => password_hash($temp_password, PASSWORD_BCRYPT),
                'temp_password' => $temp_password, // Saved for admin panel dashboard reference
                'course'        => $payment['course'],
                'phone'         => $payment['phone'],
                'created_at'    => $payment['timestamp'],
            ];
            write_json_file('students.json', $students);
        }

        // ── Email: student welcome with login credentials (new registrations only)
        if ($temp_password !== null) {
            $pid   = $payment['payment_id'];
            $pname = $payment['name'];
            $pemail = $payment['email'];
            $pcourse = $payment['course'];

            $student_html = <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333333;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#003366">Welcome to IMBS, {$pname}!</h2>
  <p>Your enrollment for <strong>{$pcourse}</strong> has been confirmed.
     Here are your student portal login credentials:</p>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa;width:40%"><strong>Username</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pemail}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Temporary Password</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$temp_password}</td>
    </tr>
  </table>
  <p>Please log in and change your password immediately after first login.</p>
  <p style="color:#888888;font-size:12px">Payment Reference: {$pid}</p>
  <p>Warm regards,<br><strong>IMBS Admissions Team</strong></p>
</body>
</html>
HTML;

            send_email($payment['email'], 'Welcome to IMBS – Your Login Credentials', $student_html);
        }

        // ── Email: admin payment alert
        $pid     = $payment['payment_id'];
        $pname   = $payment['name'];
        $pemail  = $payment['email'];
        $pphone  = $payment['phone'];
        $pcourse = $payment['course'];
        $pamount = number_format($payment['amount']);
        $pts     = $payment['timestamp'];

        $admin_html = <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333333;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#003366">New Payment Received</h2>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa;width:40%"><strong>Payment ID</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pid}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Student Name</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pname}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Email</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pemail}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Phone</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pphone}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Course</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pcourse}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Amount</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">&#8377;{$pamount}</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #dddddd;background:#f5f7fa"><strong>Timestamp</strong></td>
      <td style="padding:10px;border:1px solid #dddddd">{$pts}</td>
    </tr>
  </table>
</body>
</html>
HTML;

        send_email(SMTP_FROM_EMAIL, "New Payment – {$payment['name']} | {$payment['course']}", $admin_html);

        json_ok(['success' => true, 'message' => 'Payment recorded and student registered']);

    case 'student_login':
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if (!$email || !$password) {
            json_error('Email and password are required', 400);
        }

        $students = read_json_file('students.json');
        $found_student = null;
        foreach ($students as $student) {
            if (strtolower(trim($student['email'])) === $email) {
                if (password_verify($password, $student['password']) || $password === $student['password']) {
                    $found_student = $student;
                    break;
                }
            }
        }

        if (!$found_student) {
            if ($email === 'student@imbs.edu' && $password === 'imbs2024') {
                $found_student = [
                    'email' => 'student@imbs.edu',
                    'name' => 'Arjun Anand',
                    'course' => 'Masters Program in Business Administration',
                    'phone' => '7702251899',
                    'created_at' => (new DateTimeImmutable('2025-01-20T10:00:00Z'))->format(DateTimeInterface::ATOM)
                ];
            } else {
                json_error('Invalid email or password', 401);
            }
        }

        json_ok([
            'success' => true,
            'token' => base64_encode($found_student['email']),
            'student' => [
                'email' => $found_student['email'],
                'name' => $found_student['name'],
                'course' => $found_student['course']
            ]
        ]);

    case 'get_student_dashboard':
        $auth = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '');

        $email = '';
        if (preg_match('/^Bearer\s+(.+)$/i', trim((string) $auth), $matches)) {
            $email = strtolower(trim(base64_decode($matches[1])));
        }

        if (!$email) {
            json_error('Unauthorized', 401);
        }

        $students = read_json_file('students.json');
        $student = null;
        foreach ($students as $s) {
            if (strtolower(trim($s['email'])) === $email) {
                $student = $s;
                break;
            }
        }

        if (!$student && $email === 'student@imbs.edu') {
            $student = [
                'email' => 'student@imbs.edu',
                'name' => 'Arjun Anand',
                'course' => 'Masters Program in Business Administration',
                'phone' => '7702251899',
                'created_at' => '2025-01-20T10:00:00Z'
            ];
        }

        if (!$student) {
            json_error('Student not found', 404);
        }

        $all_payments = read_json_file('payments.json');
        $student_payments = [];
        $total_paid = 0;
        foreach ($all_payments as $p) {
            if (strtolower(trim($p['email'])) === $email) {
                $student_payments[] = $p;
                $total_paid += $p['amount'];
            }
        }

        if ($email === 'student@imbs.edu' && empty($student_payments)) {
            $student_payments = [
                [
                    'payment_id' => 'pay_DEMO1111111111',
                    'name' => 'Arjun Anand',
                    'email' => 'student@imbs.edu',
                    'course' => 'Masters Program in Business Administration',
                    'amount' => 1000,
                    'phone' => '7702251899',
                    'currency' => 'USD',
                    'timestamp' => '2025-01-20T10:00:00Z',
                    'method' => 'Bank Transfer',
                    'label' => 'Instalment 1 of 6'
                ],
                [
                    'payment_id' => 'pay_DEMO2222222222',
                    'name' => 'Arjun Anand',
                    'email' => 'student@imbs.edu',
                    'course' => 'Masters Program in Business Administration',
                    'amount' => 1000,
                    'phone' => '7702251899',
                    'currency' => 'USD',
                    'timestamp' => '2025-04-15T12:00:00Z',
                    'method' => 'Credit Card',
                    'label' => 'Instalment 2 of 6'
                ],
                [
                    'payment_id' => 'pay_DEMO3333333333',
                    'name' => 'Arjun Anand',
                    'email' => 'student@imbs.edu',
                    'course' => 'Masters Program in Business Administration',
                    'amount' => 1000,
                    'phone' => '7702251899',
                    'currency' => 'USD',
                    'timestamp' => '2025-11-12T14:30:00Z',
                    'method' => 'Bank Transfer',
                    'label' => 'Instalment 3 of 6'
                ]
            ];
            $total_paid = 3000;
        }

        $courses = read_json_file('courses.json');
        $course_details = null;
        foreach ($courses as $c) {
            if (strcasecmp($c['title'], $student['course']) === 0 || strcasecmp($c['slug'], $student['course']) === 0) {
                $course_details = $c;
                break;
            }
        }

        if (!$course_details) {
            foreach ($courses as $c) {
                if (strpos(strtolower($student['course']), strtolower($c['short_name'])) !== false) {
                    $course_details = $c;
                    break;
                }
            }
        }

        if (!$course_details) {
            $course_details = [
                'title' => $student['course'],
                'category' => 'masters',
                'hero' => ['duration' => '24 Months'],
                'fees' => [
                    'USD' => [
                        'amount' => 6000,
                        'display' => '$6,000',
                        'installments' => [
                            ['label' => 'Instalment 1', 'amount' => 1000, 'display' => '$1,000'],
                            ['label' => 'Instalment 2', 'amount' => 1000, 'display' => '$1,000'],
                            ['label' => 'Instalment 3', 'amount' => 1000, 'display' => '$1,000'],
                            ['label' => 'Instalment 4', 'amount' => 1000, 'display' => '$1,000'],
                            ['label' => 'Instalment 5', 'amount' => 1000, 'display' => '$1,000'],
                            ['label' => 'Instalment 6', 'amount' => 1000, 'display' => '$1,000'],
                        ]
                    ]
                ]
            ];
        }

        json_ok([
            'success' => true,
            'student' => $student,
            'payments' => $student_payments,
            'total_paid' => $total_paid,
            'course' => $course_details
        ]);

    // ── Admin GET: read payments ──────────────────────────────────────────────

    case 'get_payments':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        json_ok(read_json_file('payments.json'));

    case 'get_students':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        json_ok(read_json_file('students.json'));

    // ── Admin POST: write endpoints ───────────────────────────────────────────

    case 'save_courses':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('courses.json', request_body());
        json_ok(['success' => true, 'message' => 'Courses saved']);

    case 'save_categories':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('categories.json', request_body());
        json_ok(['success' => true, 'message' => 'Categories saved']);

    case 'save_accreditations':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('accreditations.json', request_body());
        json_ok(['success' => true, 'message' => 'Accreditations saved']);

    case 'save_partners':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('partners.json', request_body());
        json_ok(['success' => true, 'message' => 'Partners saved']);

    // ── Public GET: CMS flat-file data ───────────────────────────────────────

    case 'get_homepage':
        json_ok(read_json_file('homepage.json'));

    case 'get_faqs':
        json_ok(read_json_file('faqs.json'));

    case 'get_testimonials':
        json_ok(read_json_file('testimonials.json'));

    case 'get_blogs':
        json_ok(read_json_file('blogs.json'));

    // ── Admin POST: CMS flat-file writes ─────────────────────────────────────

    case 'save_homepage':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('homepage.json', request_body());
        json_ok(['success' => true, 'message' => 'Homepage saved']);

    case 'save_faqs':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('faqs.json', request_body());
        json_ok(['success' => true, 'message' => 'FAQs saved']);

    case 'save_testimonials':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('testimonials.json', request_body());
        json_ok(['success' => true, 'message' => 'Testimonials saved']);

    case 'save_blogs':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        write_json_file('blogs.json', request_body());
        json_ok(['success' => true, 'message' => 'Blogs saved']);

    // ── Admin GET: read leads ─────────────────────────────────────────────────

    case 'get_leads':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        json_ok(read_json_file('leads.json'));

    // ── Admin POST: delete a single lead ─────────────────────────────────────

    case 'delete_lead':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $idx = isset($body['index']) ? (int) $body['index'] : -1;
        $leads = read_json_file('leads.json');
        if ($idx < 0 || $idx >= count($leads)) {
            json_error('Lead not found', 404);
        }
        array_splice($leads, $idx, 1);
        write_json_file('leads.json', array_values($leads));
        json_ok(['success' => true, 'message' => 'Lead deleted']);

    // ── Admin POST: delete a single student ───────────────────────────────────

    case 'delete_student':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if (!$email) {
            json_error('Email is required', 400);
        }
        $students = read_json_file('students.json');
        $filtered = array_values(array_filter($students, function ($s) use ($email) {
            return strtolower(trim((string) ($s['email'] ?? ''))) !== $email;
        }));
        if (count($filtered) === count($students)) {
            json_error('Student not found', 404);
        }
        write_json_file('students.json', $filtered);
        json_ok(['success' => true, 'message' => 'Student deleted']);

    // ── Admin POST: delete a single partner university ────────────────────────

    case 'delete_partner':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $idx = isset($body['index']) ? (int) $body['index'] : -1;
        $partners = read_json_file('partners.json');
        if ($idx < 0 || $idx >= count($partners)) {
            json_error('Partner not found', 404);
        }
        array_splice($partners, $idx, 1);
        write_json_file('partners.json', array_values($partners));
        json_ok(['success' => true, 'message' => 'Partner deleted']);

    // ── Admin POST: delete a single accreditation ─────────────────────────────

    case 'delete_accreditation':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $idx = isset($body['index']) ? (int) $body['index'] : -1;
        $accreds = read_json_file('accreditations.json');
        if ($idx < 0 || $idx >= count($accreds)) {
            json_error('Accreditation not found', 404);
        }
        array_splice($accreds, $idx, 1);
        write_json_file('accreditations.json', array_values($accreds));
        json_ok(['success' => true, 'message' => 'Accreditation deleted']);

    // ── Admin POST: delete a single site FAQ ──────────────────────────────────

    case 'delete_faq':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $idx = isset($body['index']) ? (int) $body['index'] : -1;
        $faqs = read_json_file('faqs.json');
        if ($idx < 0 || $idx >= count($faqs)) {
            json_error('FAQ not found', 404);
        }
        array_splice($faqs, $idx, 1);
        write_json_file('faqs.json', array_values($faqs));
        json_ok(['success' => true, 'message' => 'FAQ deleted']);

    // ── Admin POST: delete a single blog post ─────────────────────────────────

    case 'delete_blog':
        if (!$is_admin) {
            json_error('Unauthorized', 401);
        }
        if ($method !== 'POST') {
            json_error('Method not allowed', 405);
        }
        $body = request_body();
        if (!isset($body['admin_password']) || $body['admin_password'] !== ADMIN_PASSWORD) {
            json_error('Incorrect admin password', 403);
        }
        $idx = isset($body['index']) ? (int) $body['index'] : -1;
        $blogs = read_json_file('blogs.json');
        if ($idx < 0 || $idx >= count($blogs)) {
            json_error('Blog post not found', 404);
        }
        array_splice($blogs, $idx, 1);
        write_json_file('blogs.json', array_values($blogs));
        json_ok(['success' => true, 'message' => 'Blog post deleted']);

    // ── Fallback ──────────────────────────────────────────────────────────────

    default:
        json_error("Unknown action: {$action}", 400);
}

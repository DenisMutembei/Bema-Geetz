<?php
// Installation script - run once to set up database
// Delete this file after installation!

require_once __DIR__ . '/config/database.php';

try {
    // Read and execute schema
    $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
    
    // Split by semicolons to execute each statement
    $statements = array_filter(array_map('trim', explode(';', $schema)));
    
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'Duplicate entry') === false && 
                strpos($e->getMessage(), 'already exists') === false) {
                throw $e;
            }
        }
    }
    
    echo "Installation completed successfully!<br>\n";
    echo "Default admin account:<br>\n";
    echo "Email: admin@bemageetz.com<br>\n";
    echo "Password: admin123<br>\n";
    echo "<br><strong>DELETE THIS install.php FILE NOW!</strong>";
    
} catch (Exception $e) {
    echo "Installation failed: " . $e->getMessage();
}
?>

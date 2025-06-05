<?php
$password = '$2a$04$8..chAuOKIy3WawT00vZUudT6NeIm1J/Gi/rpCacIKECMQ9JeXHjK'; // the actual password you typed during signup
$storedHash = '$2a$04$8..chAuOKIy3WawT00vZUudT6NeIm1J/Gi/rpCacIKECMQ9JeXHjK';

if (password_verify($password, $storedHash)) {
    echo "✅ Password matches!";
} else {
    echo "❌ Password does NOT match.";
}
?>

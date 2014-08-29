<?php

$s = "Name:\r\n" . $_POST["name"] . "\r\n\r\nCompany\r\n" . $_POST["company"] . "\r\n\r\nEmail\r\n" . $_POST["email"] . "\r\n\r\n\r\n" . $_POST["message"];

$headers = 'From: Script Sorcerer <contact@scriptsorcerer.com>' . "\r\n" .
    'Reply-To: ' . $_POST["name"] . ' <' . $_POST["email"] . '>' . "\r\n" .
    'X-Mailer: PHP/' . phpversion();

$ret["success"] = mail("contact@scriptsorcerer.com", "SS Contact Form", $s, $headers);

echo(json_encode($ret));

?>
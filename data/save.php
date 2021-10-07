<?php
session_start();
if (isset($_SESSION["logged"]) && $_SESSION["logged"] === 1) {
    if (isset($_POST)) {
        $recieved = file_get_contents('php://input');
        // only if the encrypted data were successfully saved, output it to loop
        if(file_put_contents("vault", $recieved)) {
            echo $recieved;
        }

    }
}
?>
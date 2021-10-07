<?php
session_start();
if (file_exists("hash.php")) {

    include ("hash.php");

    if (isset($_POST["hash"])) {
        if ($_POST["hash"] === $hash) {
            $_SESSION["logged"] = 1;
            if (file_exists("vault")) {
                echo 1; // regular login
            } else {
                echo 2; // someone corrupted the vault file
            }
        }
    }

} else {
    $string = "<?php \$hash = '".$_POST["hash"]."';?>";
    if(file_put_contents("hash.php", $string)) {
        $_SESSION["logged"] = 1;
        echo 3;
    }
}
?>
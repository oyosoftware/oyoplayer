<?php

error_reporting(E_ERROR);

$filename = "" . $_GET['source'];

$pos = mb_strrpos($filename, "/");
$target = mb_substr($filename, 0, $pos);
$link = "audio";
symlink($target, $link);
$filename = $link . mb_substr($filename, $pos);

readfile($filename);
rmdir($link);
?>

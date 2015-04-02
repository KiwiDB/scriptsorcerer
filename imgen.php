<?php

$width = isset($_GET["w"]) ? $_GET["w"] : false;
$height = isset($_GET["h"]) ? $_GET["h"] : false;
$filename = $_GET["f"];

$extension = strtolower(strrchr($filename, '.'));

switch($extension)
{
    case '.jpg':
    case '.jpeg':
        $img = @imagecreatefromjpeg($filename);
        break;
    case '.gif':
        $img = @imagecreatefromgif($filename);
        break;
    case '.png':
        $img = @imagecreatefrompng($filename);
        break;
    default:
        $img = false;
        break;
}

if($img && ($width || $height))
{
	$width_o  = imagesx($img);
	$height_o = imagesy($img);

	//Ratio of the final image
	//$ratio = $width / $height;

	//Ratio of the original image
	$ratio_o = $width_o / $height_o;

	//If the width of the original image is larger
	if(($width && $height && ($ratio_o > 1)) || ($width && !$height))
	{
		//Final width is the full width
		$width_f = $width;
		$height_f = $width / $ratio_o;

		//If the final height is larger than the passed-in height, needs to be smaller
		if($height && ($height_f > $height))
		{
			$height_f = $height;
			$width_f = $height_f * $ratio_o;
		}
	}
	//If the height of the original image is larger
	else
	{
		//Final height of the full height
		$height_f = $height;
		$width_f = $height_f * $ratio_o;

		//If the final width is larger than the passed-in width, needs to be smaller
		if($width && ($width_f > $width))
		{
			$width_f = $width;
			$height_f = $width_f / $ratio_o;
		}
	}

	$img_r = imagecreatetruecolor($width_f, $height_f);
	imagecopyresampled($img_r, $img, 0, 0, 0, 0, $width_f, $height_f, $width_o, $height_o);
	//imageinterlace($img_r, true);
	
	//header('Content-Type: image/png');
	//imagepng($img_r, null, 9);

	header('Content-Type: image/jpeg');
	imagejpeg($img_r, null, 100);

	//header('Content-Type: image/gif');
	//imagegif($img_r);

	imagedestroy($img);
	imagedestroy($img_r);
}
else
{
	/* Create a black image */
    $im  = imagecreatetruecolor(150, 30);
    $bgc = imagecolorallocate($im, 255, 255, 255);
    $tc  = imagecolorallocate($im, 0, 0, 0);

    imagefilledrectangle($im, 0, 0, 150, 30, $bgc);

    /* Output an error message */
    imagestring($im, 1, 5, 5, 'Error loading ' . $filename, $tc);

    header('Content-Type: image/png');
	imagepng($im);
	imagedestroy($im);
}

?>
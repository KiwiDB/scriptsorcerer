var windowSize = {w: 0, h: 0};
var chartOver = false;
var menuBG = false;
var startBottom = false;
var pos = {};
var popupSize = {};
var loadtime = 0;

//These are the elements that need to load/run before the site will display
var pl = {
	"load": {
		"type": "process",
		"loaded": false
	},
	"init": {
		"type": "process",
		"loaded": false
	},
	"resize": {
		"type": "process",
		"loaded": false
	},
	"parallax": {
		"type": "process",
		"loaded": false
	}
}

//Preload timer
var plTimer = false;
var plCount = 0;

//Stops parallax code from running on devices too small to display the images
var stopParallax = false;

//Multi-browser scroll position
function getScrollXY()
{
	var x = 0;
	var y = 0;

	//Netscape compliant
	if(typeof(window.pageYOffset) == "number")
	{
		x = window.pageXOffset;
		y = window.pageYOffset;
	}
	//DOM compliant
	else if(document.body && (document.body.scrollLeft || document.body.scrollTop))
	{
		x = document.body.scrollLeft;
		y = document.body.scrollTop;
	}
	//IE6 standards compliant mode
	else if(document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop))
	{
		x = document.documentElement.scrollLeft;
		y = document.documentElement.scrollTop;
	}

	return [x,y];
}

$(function()
{
	//Start the load loop
	plTimer = setInterval(displayPage, 100);

	//Give the page time to work before initalizing
	setTimeout(init, 500);

	//Skills Graph
	var items = [
        {"id": "development", "label": "Development", "level": 5},
        {"id": "integration", "label": "Integration", "level": 5},
        {"id": "design", "label": "Design", "level": 4},
        {"id": "database", "label": "Databases", "level": 5},
        {"id": "projects", "label": "Projects", "level": 3.5},
        {"id": "cms", "label": "CMS", "level": 4},
        {"id": "other", "label": "Other", "level": 5}
    ];

    $(".skill-graph").RadarBadge({
    	n: "First",
        items: items,
        animationDuration: 1500,
        mouseover: function(e, i){
			if(chartOver != i.id)
			{
				$("text").each(function()
				{
					if($(this).attr("id") != "radar_text_" + i.id)
						$(this).attr("fill", "#666");
					else
						$(this).attr("fill", "#34799E");
				});
			}
		},
		mouseout: function(e){
			$("text").attr("fill", "#666");
		},
		click: displayTrait
    });

    //Sliders
    $('.slider').bxSlider({
    	mode: "fade",
    	speed: 1000,
		auto: true,
		autoControls: true,
		controls: false,
		pause: 8000,
		autoHover: true
	});

	$('.slider-img').bxSlider({
    	mode: "fade",
    	speed: 4000,
		auto: true,
		autoControls: true,
		controls: false,
		pause: 8000,
		autoHover: true
	});

	pl["load"].loaded = true;
});

//One-time load functions -- don't rerun for resize or scroll
function init()
{
	//Put the page in "mobile" mode if needed
	mobile();

	windowSize.w = window.innerWidth;
	windowSize.h = window.innerHeight;

	window.onresize = resizeSet;
	resizeSet();

	window.onscroll = imgSet;
	//imgSet();		<-- Called from within resizeSet

	//Preload images
	for(i in pl)
	{
		if(pl[i].type == "img")
		{
			im = new Image();
			im.id = i;
			im.src = pl[i].img;
			im.onload = function(){console.log("Setting " + this.id + " as LOADED"); pl[this.id].loaded = true;}
		}
	}

	//Set the init element as finished
	pl["init"].loaded = true;
}

//Runs whenever the window is resized
function resizeSet()
{
	windowSize.w = window.innerWidth;
	windowSize.h = window.innerHeight;

	//Turn off parallax if window size is small enough, or if we're on a mobile device (modernizr determined)
	if((windowSize.w <= 830) || ($(".mobile").length))
		stopParallax = true;
	else
		stopParallax = false;

	//Parallax
	startBottom = $("#main-container").get(0).getBoundingClientRect().height + windowSize.h;

	$("#main-container").css("margin-top", windowSize.h + "px").css("margin-bottom", windowSize.h + "px");
	$("#top-image").css("height", windowSize.h + "px");
	$("#bottom-image").css("height", windowSize.h + "px").css("top", startBottom + "px");

	//Set the resize element as loaded (initial page load)
	pl["resize"].loaded = true;

	imgSet();
}

//Runs whenever the browser is scrolled (controls parallax effect)
function imgSet()
{
	//If we're disabled parallax -- there's nothing to do here
	if(!stopParallax)
	{
		var sp = getScrollXY();
		var bt = (startBottom - (startBottom - sp[1]/2));

		//Calculate offsets for top and bottom
		$("#top-image").css("top", (sp[1]/2) + "px");
		$("#bottom-image").css("top", (startBottom + (sp[1] - startBottom) / 2) + "px");

		//Animation for the top menu
		if(sp[1] >= (windowSize.h - 120))
		{
			if(!menuBG)
			{
				menuBG = true;
				$("#top-menu .menu-logo").css("visibility", "visible");

				$("#top-menu").animate(
				{
				    "background-color": "rgba(52, 121, 158, 1)",
				    "padding-top": "5px",
				    "padding-bottom": "15px"
				}, 200);

				$("#top-menu .menu-logo").animate(
				{
					"opacity": 1
				}, 200);
			}
		}
		else
		{
			if(menuBG)
			{
				menuBG = false;

				$("#top-menu").animate(
				{
				    "background-color": "rgba(52, 121, 158, 0)",
				    "padding-top": "20px",
				    "padding-bottom": "0px"
				}, 200);

				$("#top-menu .menu-logo").animate(
				{
					"opacity": 0
				}, 200, function(){$(this).css("visibility", "hidden");});
			}
		}
	}

	//Set the parallax element as loaded (initial page load)
	pl["parallax"].loaded = true;
}

//Determines if the page is ready to display, and displays it if so
function displayPage()
{
	var ready = true;
	var nr = "";

	//Check if each element has loaded
	for(i in pl)
	{
		if(pl[i].loaded == false)
			ready = false;
	}

	//If we're ready (cut off at 100 tries, 10 seconds, in case something goes wrong)
	if(ready || (plCount > 100))
	{
		//Hide the loading bar and display content
		$("#loadBar").css("display", "none");
		$(".hide-before-ready").animate({"opacity": 1}, 1000);
		$("body").css("overflow", "auto");

		clearInterval(plTimer);
	}

	plCount++;
}

//Display the mobile menu
function showMobileMenu()
{
	//Overlay
	var o = $(document.createElement("div"));
	o.attr("id", "site-details-overlay");
	o.attr("class", "site-overlay");
	o.bind("click", closeMobileMenu);
	$("body").addClass("noscroll");
	$("body").append(o);

	var content = $(".menu-items-container").html();

	//Popup
	var p = $(document.createElement("div"));
	p.attr("id", "mobile-menu");
	p.attr("class", "mobile-menu");
	p.html(content);

	var w = windowSize.w * 0.9;
	w = (w > 1200 ? 1200 : w);

	var h = windowSize.h * 0.9;
	h = (h > 800 ? 800 : h);

	var t = (windowSize.h - h) / 2;
	var l = (windowSize.w - w) / 2;

	p.css("width", w + "px");
	p.css("height", h + "px");
	p.css("top", t + "px");
	p.css("left", l + "px");

	popupSize = {w: w, h: h};

	$("body").append(p);

	//Add the top link
	$("#mobile-menu ul").prepend("<li><a href='javascript:void(0)' onclick='moveToSection(\"top\");'>Top</a></li>");
}

//Close the mobile menu
function closeMobileMenu()
{
	$("#site-details-overlay").remove();
	$("body").removeClass("noscroll");
	$("#mobile-menu").remove();
}

//Nav link scroll
function moveToSection(id)
{
	//If we are going to the "top" go there specifically
	if(id == "top")
	{
		$.scrollTo(0, 1000,
			{
				easing: "easeInOutQuart"
			}
		);
	}
	//Otherwise, go for ID (and account for the top menu height)
	else
	{
		$.scrollTo($(".scroll-" + id), 1000,
			{
				offset: -1 * $("#top-menu").get(0).offsetHeight,
				easing: "easeInOutQuart"
			}
		);
	}

	closeMobileMenu();
}

//Runs when a trait from the skills section is clicked
function displayTrait(e, i)
{
	//Go out from target so that this would work with multiple graphs
	var parent = $(e.target).closest("div");

	//First click
	if($(".skill-list-container").length == 0)
	{
		$("#portfolio .skills .instructions").fadeOut();

		parent.fadeOut(function()
		{
			textClass(i, "active_text");
			parent.closest(".skill-cell").addClass("table-cell").closest(".skill-row").addClass("table-row").closest(".skill-table").addClass("table");
			parent.closest(".skill-row").append("<div class='skill-list-container table-cell'>" + skillList(i) + "</div>");
			
			$(this).fadeIn();
			$("#portfolio .skills .table-cell ul").fadeIn();
		});
	}
	//Anything else
	else
	{
		$(".skill-list-container ul").fadeOut(function()
		{
			textClass(i, "active_text");

			$(this).remove();
			$(".skill-list-container").html(skillList(i));
			$(".skill-list-container ul").fadeIn();
		});
	}
}

//Adds class to one skill in the skill graph, and removes it from the others (used to highlight the currently displayed skill)
function textClass(i, c)
{
	//Long term highlight of the item clicked
	if(chartOver != i.id)
	{
		$("text").each(function()
		{
			if($(this).attr("id") != "radar_text_" + i.id)
			{
				$(this).attr("class", $(this).attr("class").replace(" " + c, ""));
			}
			else
				$(this).attr("class", $(this).attr("class") + " "+ c);
		});
	}
}

//Skill higherarchy
function skillList(i)
{
	var s = "";

	if(i.id == "development")
	{
		s = "<ul class='skill-list' style='display:none;'>"
			+ "<li>HTML5</li>"
			+ "<li>Javascript</li>"
			+ "<li>PHP</li>"
			+ "<li>AJAX</li>"
			+ "<li>jQuery</li>"
			+ "<li>Canvas / SVG</li>"
		+ "</ul>";
	}
	else if(i.id == "integration")
	{
		s = "<ul class='skill-list'>"
			+ "<li>Web Services</li>"
			+ "<li>SOAP / RESTful</li>"
			+ "<li>AWS</li>"
			+ "<li>Headless Browser</li>"
			+ "<li>Automation</li>"
			+ "<li>Website Scraping</li>"
			+ "<li>Monitoring</li>"
		+ "</ul>";
	}
	else if(i.id == "design")
	{
		s = "<ul class='skill-list'>"
			+ "<li>CSS3</li>"
			+ "<li>Responsive Design</li>"
			+ "<li>Media Queries</li>"
			+ "<li>Parallax Scroll</li>"
			+ "<li>CSS Animations</li>"
		+ "</ul>";
	}
	else if(i.id == "database")
	{
		s = "<ul class='skill-list'>"
			+ "<li>MySQL</li>"
			+ "<li>Normalization</li>"
			+ "<li>XML</li>"
			+ "<li>JSON</li>"
		+ "</ul>";
	}
	else if(i.id == "projects")
	{
		s = "<ul class='skill-list'>"
			+ "<li>Project Management</li>"
			+ "<li>Team Structure</li>"
			+ "<li>Project Design</li>"
		+ "</ul>";
	}
	else if(i.id == "cms")
	{
		s = "<ul class='skill-list'>"
			+ "<li>Wordpress</li>"
			+ "<li>WP Templates</li>"
			+ "<li>WP Plugins</li>"
			+ "<li>Joomla!</li>"
			+ "<li>J! Alternate Layouts</li>"
			+ "<li>J! Custom Menu Types</li>"
			+ "<li>J! Modules</li>"
		+ "</ul>";
	}
	else if(i.id == "other")
	{
		s = "<ul class='skill-list'>"
			+ "<li>Fast Typer</li>"
			+ "<li>Innovative</li>"
		+ "</ul>";
	}

	return s;
}

//Display the dialog for site details
function showSiteDetails(s)
{
	//Overlay
	var o = $(document.createElement("div"));
	o.attr("id", "site-details-overlay");
	o.attr("class", "site-overlay");
	o.bind("click", closeSiteDetails);
	o.css("display", "none");

	$("body").addClass("noscroll");
	$("body").append(o);

	//Loading animation
	var loading = $(document.createElement("div"));
	loading.attr("class", "loading-popup");
	loading.html("<img src='images/load.gif' />");
	loading.css("display", "none");

	$("body").append(loading);
	$(".loading-popup").fadeIn();
	$("#site-details-overlay").fadeIn();

	//Grab the detail content
	$.ajax(
	{
		url: "descriptions/site-details/" + s,
		dataType: "html",
		success: function(data)
		{
			var content = "<div class='popup_content'>" + data + "</div>";
			content += "<div id='popup_close' onclick='closeSiteDetails()'><span class='close-big'>X</span><span class='close-small'>[close]</span></div>";
			content += "<div id='popup_gal_open' style='display:none' onclick='closeSiteDetailsImg()'></div>";

			//Popup
			var p = $(document.createElement("div"));
			p.attr("id", "site-details");
			p.attr("class", "site-details");
			p.html(content);

			var w = windowSize.w * 0.9;
			w = (w > 1200 ? 1200 : w);

			var h = windowSize.h * 0.9;
			h = (h > 800 ? 800 : h);

			var t = (windowSize.h - h) / 2;
			var l = (windowSize.w - w) / 2;

			p.css("width", w + "px");
			p.css("height", h + "px");
			p.css("top", t + "px");
			p.css("left", l + "px");

			popupSize = {w: w, h: h};

			//Fade
			p.css("display", "none");
			$("body").append(p);
			$(".loading-popup").stop().fadeOut(function() { $(this).remove(); });
			$("#site-details").fadeIn();
		}
	})
}

//Close the site details dialog
function closeSiteDetails()
{
	$("#site-details").fadeOut(function()
	{
		$("#site-details").remove();
	});
	
	$("#site-details-overlay").fadeOut(function()
	{
		$("#site-details-overlay").remove();
		//$("body").css("overflow", "auto");
		$("body").removeClass("noscroll");
	})
}

//Display an image from the gallery when clicked
function siteDetailsImageOpen(i)
{
	var im = new Image();
	im.src = "imgen.php?f=images/sites/details/" + i + "&w=" + (popupSize.w-20) + "&h=" + (popupSize.h-20);
	im.onload = function(){$(".gal-load").css("display","none");$(".open-gal-container").fadeIn();}

	$("#popup_gal_open").html("<div class='gal-load'><img src='images/load.gif' /></div><div class='open-gal-container' style='display:none'><img src='imgen.php?f=images/sites/details/" + i + "&w=" + (popupSize.w-20) + "&h=" + (popupSize.h-20) + "' /></div>");
	$("#popup_gal_open").css("display", "");
}

//Close the galary image
function closeSiteDetailsImg()
{
	$("#popup_gal_open").fadeOut(function(){$(this).html("");});
}

//Submit the contact form
function contactForm()
{
	//Working animation
	$("form.contact-form input[type=submit]").prop("disabled", true).css("display", "none");
	$("form.contact-form .submit-row img.working").css("display", "");

	$.ajax(
	{
		url: "submitContact.php",
		dataType: "json",
		type: "post",
		data: $("form.contact-form").serialize(),
		success: function(data)
		{
			$("form.contact-form .submit-row img.working").css("display", "none");

			if(data.success)
			{

				$("form.contact-form .submit-row div.success").css("display", "");

				//Success message
				setTimeout('$("form.contact-form .submit-row div.success").fadeOut("slow", function(){$("form.contact-form input:not([type=submit]),form.contact-form textarea").val(""); $("form.contact-form input[type=submit]").prop("disabled", false).fadeIn("slow"); document.getElementById("contact-form").reset();});', 2000);
			}
			else
			{
				$("form.contact-form .submit-row div.error").css("display", "");

				//Error message
				setTimeout('$("form.contact-form .submit-row div.error").fadeOut("slow", function(){$("form.contact-form input[type=submit]").prop("disabled", false).fadeIn("slow");});', 2000);
			}
		}
	});
}
//RadarBadge

(function( $ ) {
 	
 	//These are the functions that are allowed to be invoked externally
 	var commands = {  
        animate: animate,
        destroy: destroy,
        add: addItem,
        delete: deleteItem,
        rebuild: rebuild
    }; 

    $.fn.RadarBadge = function(options) {

		//This code exposes the functions in the commands object
		if (typeof arguments[0] === 'string') {
			var property = arguments[1];
			var args = Array.prototype.slice.call(arguments);
			args.splice(0, 1);

			if(commands[arguments[0]])
				return commands[arguments[0]].apply(this, args);

			return false;
		}
		//Normal path for the plugin
		else {
			return init.apply(this, arguments);
		}
    };

    //Prepare for the creation of a chart display
    function init(options, ex) {
    	//Handle the array of SVG attributes separately
    	var attrs = $.extend({}, $.fn.RadarBadge.defaults.svgAttrs, options.svgAttrs ? options.svgAttrs : {});

    	//Merge the default settings with options passed to the plugin
    	var settings_gl = $.extend({}, $.fn.RadarBadge.defaults, options );
	    settings_gl.start.call(this);

    	return this.each(function() {
	    	var e = $(this);

	    	//Support for the metadata plugin
			var settings = $.meta ? $.extend({}, settings_gl, $this.data()) : settings_gl;

			//Create the hidden settings element
			if((!ex || !ex.dontsave) && (settings.saveData)) {
				var s = $("<div>")
						.addClass("radardata");

				s.html(JSON.stringify(settings));
				e.append(s);
			}
			//Load the hidden settings element and merge it with options passed to the plugin
			else if(ex && ex.loadsave) {
				var d = getSavedData(e);

				if(d)
					settings = $.extend({}, d, options );

				//Special handling for callbacks not passed or saved
				if(!settings.mouseover)	settings.mouseover = $.fn.RadarBadge.defaults.mouseover;
				if(!settings.click)		settings.click = $.fn.RadarBadge.defaults.click;
				if(!settings.coToIndx)	settings.coToIndx = $.fn.RadarBadge.defaults.coToIndx;
			}

			//Minumum animation duration is 1
			if(settings.animationDuration < 1)
				settings.animationDuration = 1;

	        //Create the SVG element - if you remove the width and height settings, the graph will not display correctly
	        var s = $("<svg width='0' height='0'>")
	        		.attr(attrs);

	        //Save settings globally within the plugin namespace -- used for later functions without passing the settings object around
	        data.o = settings;

	        //Save and set callback functions
	        data.callbacks = {
	        	mo: settings.mouseover,
	        	click: settings.click,
	        	coToIndx: settings.coToIndx
	        };

	        s.bind("mousemove", mo);
	        s.bind("click", clk);
	        s.bind("mouseout", settings.mouseout);

	        //Create the chart
	        e.append(s);
	        draw(s, settings);
	        draw_chart(s, settings);

	        //Animate only if auto-animation is enabled
	        if(settings.autoAnimate)
	        	animate.apply($(this), settings);
	    });
    }

    //Draws the static parts of the chart -- background and levels circles
    function draw(e, o) {
    	var svgNS = "http://www.w3.org/2000/svg";

    	var w = parseInt(e.attr("width"));
    	var h = parseInt(e.attr("height"));

    	//Determine circle radius
    	if((w == h) || (w < h))
    		circle_radius = w * o.circlePortion;
    	else
    		circle_radius = h * o.circlePortion;

    	//Circle Center
    	circle_center = [w/2, h/2];

    	data.circle = {
    		radius: circle_radius,
    		center: circle_center
    	};

    	//Top level circle
    	var myCircle = document.createElementNS(svgNS,"circle");
    	myCircle.setAttributeNS(null,"class","radar-bg");
	    myCircle.setAttributeNS(null,"cx",circle_center[0]);
	    myCircle.setAttributeNS(null,"cy",circle_center[1]);
	    myCircle.setAttributeNS(null,"r",circle_radius);
	    e.append(myCircle);

	    var myG = document.createElementNS(svgNS, "g");
	    myG.setAttributeNS(null,"class","radar-levels");

	    //Levels circles
	    for(i=0; i < o.maxLevels; i++) {
	    	myCircle = document.createElementNS(svgNS,"circle");
		    myCircle.setAttributeNS(null,"cx",circle_center[0]);
		    myCircle.setAttributeNS(null,"cy",circle_center[1]);
		    myCircle.setAttributeNS(null, "r", circle_radius * (1/o.maxLevels) * i);

	    	myG.appendChild(myCircle);
	    }

	    e.append(myG);

	    //Center Dot
	    if(o.useCenterDot) {
		    myCircle = document.createElementNS(svgNS,"circle");
		    myCircle.setAttributeNS(null,"class","radar-centerdot");
		    myCircle.setAttributeNS(null,"cx",250);
		    myCircle.setAttributeNS(null,"cy",250);
		    myCircle.setAttributeNS(null, "r", o.centerDotSize);

		    e.append(myCircle);
	    }

	    //Calculate mouseover ranges for the chart
	    data.moRanges = [];
	    for(var i=1; i<=o.items.length; i++) {
	    	var a = {};
	    	a = calc_morange(i, o.items.length);
	    	a.count = i % o.items.length;

	    	data.moRanges.push(a);
	    }
    };

    //Draw the chart itself (all animations are set not to run)
    function draw_chart(e, o) {
    	//Check if this browser supports SVG animation
    	var ani = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Animation", "1.0");

    	var svgNS = "http://www.w3.org/2000/svg";

    	//Calculate needed positions around the circle
    	var circle_positions = [];

		for(var i=0; i < o.items.length; i++) {
			var chart = {};

			//How far around the circle is this item
			chart.circ_part = (2 / o.items.length) * i;
			chart.radians = (chart.circ_part * Math.PI) - (Math.PI/2);

			//Point on the perimiter of the circle
			chart.point_cir = [data.circle.radius * Math.cos(chart.radians) + data.circle.center[0], data.circle.radius * Math.sin(chart.radians) + data.circle.center[1]];

			//Position for the text
			chart.point_txt = [data.circle.radius * o.textDistance * Math.cos(chart.radians) + data.circle.center[0], data.circle.radius * o.textDistance * Math.sin(chart.radians) + data.circle.center[1]];

			//Position of the point in the path (the chart display)
			chart.path_point = [data.circle.radius * (o.items[i].level / o.maxLevels) * Math.cos(chart.radians) + data.circle.center[0], data.circle.radius * (o.items[i].level / o.maxLevels) * Math.sin(chart.radians) + data.circle.center[1]];

			chart.label = o.items[i].label;
			chart.id = o.items[i].id;

			circle_positions.push(chart);
		}

		//Create path string and draw text
		if(circle_positions[0]) {
			//Starting positions for the path_point path (the final chart) and the path_start path (the starting point of the graph before the animation)
			var path_point = "M" + (circle_positions[0].path_point[0]) + " " + (circle_positions[0].path_point[1]);
			var path_start = "M" + data.circle.center[0] + " " + data.circle.center[1];

			//Create a group for point dots, but don't append it until after the chart is written (to make sure point dots are on top of the chart)
			if(o.usePointDots) {
				var pointG = document.createElementNS(svgNS, "g");
				pointG.setAttributeNS(null, "class", "radar-points");
			}

			//Create a group for text
			var textG = document.createElementNS(svgNS, "g");
			textG.setAttributeNS(null, "class", "radar-labels");
			textG.setAttributeNS(null, "style", "opacity:0");

			if(ani) {
				//This is the fade animation for text
				myAnimation = document.createElementNS(svgNS, "animate");
					myAnimation.setAttributeNS(null, "begin", "infinite");
		    		myAnimation.setAttributeNS(null, "attributeType", "CSS");
		    		myAnimation.setAttributeNS(null, "attributeName", "opacity");
		    		myAnimation.setAttributeNS(null, "from", "0");
		    		myAnimation.setAttributeNS(null, "to", "1");
		    		myAnimation.setAttributeNS(null, "dur", (o.animationDuration/1000) + "s");
		    		myAnimation.setAttributeNS(null, "calcMode", "spline");
		    		myAnimation.setAttributeNS(null, "keySplines", "0 0.75 0.25 1");
		    		myAnimation.setAttributeNS(null, "fill", "freeze");

		    		textG.appendChild(myAnimation);
		    }
		    else
		    	textG.setAttributeNS(null, "style", "opacity:1");

			for(var i=0; i < circle_positions.length; i++) {
				//Add this point to the path
				if(i != 0) {
					path_point += " L" + (circle_positions[i].path_point[0]) + " " + (circle_positions[i].path_point[1]);
					path_start += " L" + data.circle.center[0] + " " + data.circle.center[1];
				}

				//Create the text element for this item
				myCircle = document.createElementNS(svgNS,"text");
				myCircle.setAttributeNS(null, "id", "radar_text_" + circle_positions[i].id);
			    myCircle.setAttributeNS(null,"x",circle_positions[i].point_txt[0]);
			    myCircle.setAttributeNS(null,"y",circle_positions[i].point_txt[1]);

			    //Text has to be aligned based on if it's on the left side or the right side of the circle
			    if(circle_positions[i].point_txt[0] > data.circle.center[0])
			    	myCircle.setAttributeNS(null, "class", "left");
			    else if(circle_positions[i].point_txt[0] == data.circle.center[0])
			    	myCircle.setAttributeNS(null, "class", "middle");
			    else
			    	myCircle.setAttributeNS(null, "class", "right");

			    myCircle.textContent = circle_positions[i].label;

	    		textG.appendChild(myCircle);


	    		//Point Circle
	    		if(o.usePointDots) {
					myCircle = document.createElementNS(svgNS,"circle");
				    myCircle.setAttributeNS(null, "r", o.pointDotsSize);

				    if(ani) {
				    	//These are the animations that move the point circles along with the path, out from the center
			    		myAnimation = document.createElementNS(svgNS, "animate");
				    		myAnimation.setAttributeNS(null, "attributeName", "cx");
				    		myAnimation.setAttributeNS(null, "begin", "0s");
				    		myAnimation.setAttributeNS(null, "dur", (o.animationDuration/1000) + "s");
				    		myAnimation.setAttributeNS(null, "from", data.circle.center[0]);
				    		myAnimation.setAttributeNS(null, "to", circle_positions[i].path_point[0]);
				    		myAnimation.setAttributeNS(null, "calcMode", "spline");
				    		myAnimation.setAttributeNS(null, "keySplines", "0 0.75 0.25 1");
				    		myAnimation.setAttributeNS(null, "fill", "freeze");
							myAnimation.setAttributeNS(null, "begin", "infinite");

		    				myCircle.appendChild(myAnimation);

		    			myAnimation = document.createElementNS(svgNS, "animate");
				    		myAnimation.setAttributeNS(null, "attributeName", "cy");
				    		myAnimation.setAttributeNS(null, "begin", "0s");
				    		myAnimation.setAttributeNS(null, "dur", (o.animationDuration/1000) + "s");
				    		myAnimation.setAttributeNS(null, "from", data.circle.center[1]);
				    		myAnimation.setAttributeNS(null, "to", circle_positions[i].path_point[1]);
				    		myAnimation.setAttributeNS(null, "calcMode", "spline");
				    		myAnimation.setAttributeNS(null, "keySplines", "0 0.75 0.25 1");
				    		myAnimation.setAttributeNS(null, "fill", "freeze");
							myAnimation.setAttributeNS(null, "begin", "infinite");

		    				myCircle.appendChild(myAnimation);
		    		}
		    		else {
		    			myCircle.setAttributeNS(null,"cx",circle_positions[i].path_point[0]);
				    	myCircle.setAttributeNS(null,"cy",circle_positions[i].path_point[1]);
		    		}

					pointG.appendChild(myCircle);
				}
			}

			e.append(textG);

			//Close the path
			path_point += " Z";
			path_start += " Z";


			//Draw the chart
			myCircle = document.createElementNS(svgNS,"path");
			myCircle.setAttributeNS(null,"class","radar-badgeset");

				if(ani) {
					myCircle.setAttributeNS(null,"d",path_start);

					//This is the animation that grows the path from the center
			    	myAnimation = document.createElementNS(svgNS, "animate");
			    		myAnimation.setAttributeNS(null, "attributeName", "d");
			    		myAnimation.setAttributeNS(null, "begin", "0s");
			    		myAnimation.setAttributeNS(null, "dur", (o.animationDuration/1000) + "s");
			    		myAnimation.setAttributeNS(null, "from", path_start);
			    		myAnimation.setAttributeNS(null, "to", path_point);
			    		myAnimation.setAttributeNS(null, "calcMode", "spline");
			    		myAnimation.setAttributeNS(null, "keySplines", "0 0.75 0.25 1");
			    		myAnimation.setAttributeNS(null, "fill", "freeze");
						myAnimation.setAttributeNS(null, "begin", "infinite");

			    		myCircle.appendChild(myAnimation);
			    }
			    else {
			    	myCircle.setAttributeNS(null,"d",path_point);
			    }

		    e.append(myCircle);

		    //Append the point dots last, to make sure they're on top of the chart
		    if(o.usePointDots)
		    	e.append(pointG);
		}
    };

    //Read and return saved data
    function getSavedData(e) {
    	var ddiv = e.find(".radardata");

    	if(ddiv) {
			var d = ddiv.html();

			try
			{
				d = $.parseJSON(d);
				return d;
			}
			catch(e){}
		}

		return false;
    }

    //Overwrite existing saved data with new data
    function saveData(e, d) {
    	var ddiv = e.find(".radardata");

    	if(ddiv) {
    		ddiv.html(JSON.stringify(d));
    		return true;
    	}

    	return false;
    }

    //Trigger the chart to animate
    function animate(o) {
    	this.each(function() {
    		var e = $(this);
	    	
	    	$(e).find("animate").each(function()
	    	{
	    		$(this).get(0).beginElement();
	    	});
	    });
    }

    //This function allows the display to be destroyed and rebuilt with new options
    //Items waiting to be added and deleted are evaluated here
    function rebuild(o) {
    	return this.each(function() {
    		var d = getSavedData($(this));

    		//We only need to look at saved data if data has been saved
    		if(d) {
	    		//Add to the items array
	    		for(i in d.newItems) {
	    			d.items.push(d.newItems[i]);
	    		}

	    		d.newItems = [];

	    		//Delete from the items array
	    		var dontadd = [];

	    		for(i in d.delItems) {
	    			for(j in d.items) {
	    				if(d.items[j].id == d.delItems[i]) {
	    					dontadd.push(j);
	    				}
	    			}
	    		}

	    		d.delItems = [];

	    		var ni = [];

	    		for(i in d.items) {
	    			if($.inArray(i, dontadd) == -1)
	    				ni.push(d.items[i]);
	    		}

	    		d.items = ni;

	    		saveData($(this), d);
	    	}

    		destroy.call($(this));
    		init.call($(this), o ? o : {}, {"dontsave": true, "loadsave": true});
    	});
    }

    //Delete all children of the container (SVG and saved data)
    function destroy() {
    	return this.each(function() {
    		$(this).find("*").remove();
    	});
    }

    //Allows items to be added to the item array at runtime (this is only available if options.saveData was true at initial creation or rebuild)
    //Note - we don't add to the item array directly so that calculations based on the number of items is still accurate; items are added when a rebuild is triggered
    function addItem(i) {
    	return this.each(function() {
    		var d = getSavedData($(this));

    		if(d) {
	    		for(it in i)
	    			d.newItems.push(i[it]);

	    		saveData($(this), d);
	    	}
	    });
    }

    //Allows items to be deleted from the item array at runtime (this is only available if options.saveData was true at initial creation or rebuild)
    //Note - we don't remove from the item array directly so that calculations based on the number of items is still accurate; items are added when a rebuild is triggered
    function deleteItem(i) {
    	return this.each(function() {
    		var d = getSavedData($(this));

    		if(d) {
	    		for(it in i)
	    			d.delItems.push(i[it]);

	    		saveData($(this), d);
	    	}
	    });
    }

    //This function calculates the degree range within the circle for each item
    function calc_morange(i, n) {
    	var sa = (360 / n) * i;

    	return {
    		s: (sa - (360 / (n*2))) % 360,
    		e: (sa + (360 / (n*2))) % 360
    	};
    };

    //This function receives an x and y coordinate (relative to the center of the circle) and returns the index of the item that position relates to.
    //This function can be overwriten using the coToIndx option
    function coToIndx(x, y) {
    	var conv = (180 / Math.PI);

    	//Move around the circle
        if(x >= 0 && y > 0)
        	var a = Math.atan(x / y) * conv;
        else if(x < 0 && y >= 0)
        	var a = 270 + (Math.atan(Math.abs(y / x)) * conv);
        else if(x >= 0 && y < 0)
        	var a = 90 + (Math.atan(Math.abs(y / x)) * conv);
        else
        	var a = 180 + (Math.atan(Math.abs(x / y)) * conv);

        //Figure out which section of the chart I'm in
        ind = false;

        for(sec in data.moRanges) {
        	if(data.moRanges[sec].s < data.moRanges[sec].e) {
	        	if((a >= data.moRanges[sec].s) && (a < data.moRanges[sec].e)) {
	        		ind = data.moRanges[sec].count;
	        		break;
	        	}
	        }
	        else {
	        	if((a >= data.moRanges[sec].s && a <= 360) || (a < data.moRanges[sec].e && a >= 0)) {
	        		ind = data.moRanges[sec].count;
	        		break;
	        	}
	        }
        }

        return ind;
    };

    //Wrapper for the mouseover function
    function mo(e) {
    	//Get the x-y coordinate for the mouse
        t = $(e.target);

        if(!t.is("svg"))
        	t = t.closest("svg");

        t = t.get(0);

        ol = t.getBoundingClientRect().left;
    	ot = t.getBoundingClientRect().top;

    	//Recenter 0,0 at the circle center
    	x=e.clientX - ol - data.circle.center[0];
        y=(e.clientY - ot - data.circle.center[1]) * -1;

        //Special handling of this call for the restart function
        var ind = data.callbacks.coToIndx.call(null, x, y);

        data.callbacks.mo.call(null, e, ind !== false ? data.o.items[ind] : false);
    };

    //Wrapper for the click function
    function clk(e) {
    	//Get the x-y coordinate for the mouse
        t = $(e.target);

        if(!t.is("svg"))
        	t = t.closest("svg");

        t = t.get(0);

        //Recenter 0,0 at the circle center
        ol = t.getBoundingClientRect().left;
    	ot = t.getBoundingClientRect().top;

    	x=e.clientX - ol - data.circle.center[0];
        y=(e.clientY - ot - data.circle.center[1]) * -1;

        var ind = data.callbacks.coToIndx.call(null, x, y);       

        data.callbacks.click.call(null, e, ind !== false ? data.o.items[ind]: false);
    };

    //Holds working data used during the execution of the script
	var data = {
    	moRanges: []
    };

    //Defaults
    $.fn.RadarBadge.defaults = {
    	items: [],	//Items to display. {id: [string], label: [string], level: [int]}
    	newItems: [],	//Used to hold items added by the "add" method
    	delItems: [],	//Used to hold items deleted by the "delete" method
    	maxLevels: 5,	//The level representing the outside of the circle
    	svgAttrs: {		//Attributes to add inline on the svg tag. (Attributes passed will be merged with the default settings before being applied)
    		"class": "radar-badge",
    		width: 500,
    		height: 500
    	},
    	circlePortion: 0.25,	//What portion of the countainer div is used for the circle radius
    	useCenterDot: true,		//Display a dot at the center of the chart
    	centerDotSize: 3,		//How many pixels is the radius of the center dot
    	textDistance: 1.25,		//Coordinate on the circle edge times this setting is where the text is written
    	usePointDots: true,		//Use a dot at each vertex in the chart
    	pointDotsSize: 3,		//How many pixels is the radius of the point dots
    	autoAnimate: true,		//Animate on load of the chart or wait for the "animate" function to be called manually
    	animationDuration: 1000,	//Milliseconds for the animation (set to 1 for no animation)
    	saveData: false,		//Should options passed at chart creation be remembered? (true required for the add and delete methods to function)
    	start: function() {},	//Callback to call before each chart is created
    	mouseover: function() {},	//Callback to call on mouseover of svg element (receives index of the item over)
    	mouseout: function() {},	//Callback to call on mouseout of svg element
    	click: function() {},	//Callback to call on click of svg element (receives index of the item clicked)
    	coToIndx: coToIndx		//Callback of function which converts x,y coordinate (centered at circle center) to an item
    };
 
}( jQuery ));
//Objects
var util = {};
var state = {};

var props = {}

var cv = false;
var cx = false;

var runLoop = false;

$(function()
{
	$(".game-container .before-game-screen .start-screen .start-button").bind("click", function()
	{
		game_instructions();
	});

	$(".game-container .before-game-instructions .start-button").bind("click", function()
	{
		game_start();
	});
});

function game_instructions()
{
	$(".game-container .before-game-screen").fadeOut("fast", function(){$(".game-container .before-game-instructions").fadeIn("fast");});
}
function game_start()
{
	util.reset();

	state["game"] = "countdown";
	state["data"] = {count: 3, size: 1};

	$(".game-container .before-game-instructions").fadeOut("fast", function()
		{
			$(".game-container").append(util.createGame());

			cv = document.getElementById("game-content");
    		cx = cv.getContext("2d");

    		cv.addEventListener('mousemove', function(evt)
    		{
    			if(state.game == "play")
    			{
	        		var mousePos = util.getMousePos(evt);
	        		state.data.mousepos.x = mousePos["x"];
	        	}
        	});

    		runLoop = setInterval("game_run()", props.frame_rate);


			//$("#game-content").fadeIn("fast");
		});
}

function game_run()
{
	cx.fillStyle = "white";
    cx.globalAlpha = 1;
    cx.fillRect(0, 0, cv.width, cv.height);

	if(state.game == "countdown")
	{
		if(state.data.size <= 0)
		{
			if(state.data.count == 1)
			{
				state.game = "play";
				state.data = {};

				state.data.mousepos = {x: props.start.paddles};
				state.data.ballpos = {x: props.start.ball.x, y: props.start.ball.y};
				state.data.ballmove = {x: props.start.ball.move_x, y: props.start.ball.move_y};

				return;
			}

			state.data.size = 1;
			state.data.count--;
		}

		cx.fillStyle = "black";
        cx.font = "40px Arial";
        cx.globalAlpha = state.data.size;

        cx.fillText(state.data.count, 100, 100);

        state.data.size -= 0.05;
	}
	else if(state.game == "play")
	{
		var s = state.data.mousepos.x-25;
		if(s < 0)	s = 0;
		if(s > (props.game_width - props.sizes.paddles))	s = (props.game_width - props.sizes.paddles);

		cx.fillStyle = props.colors.paddle_top;
		cx.fillRect(s, 0, props.sizes.paddles, 3);

		cx.fillStyle = props.colors.paddle_bottom;
		cx.fillRect(s, 397, props.sizes.paddles, 3);

		state.data.ballpos.x += state.data.ballmove.x;
		state.data.ballpos.y += state.data.ballmove.y;

		if(state.data.ballpos.x >= (props.game_width - (props.sizes.ball_radius / 2)))
			state.data.ballmove.x = util.getBallSpeed() * -1;
		else if(state.data.ballpos.x <= (props.sizes.ball_radius / 2))
			state.data.ballmove.x = util.getBallSpeed();

		if(state.data.ballpos.y >= (props.game_width - (props.sizes.ball_radius / 2)))
		{
			if(props.start.next == "b")
			{
				var s = state.data.mousepos.x;
				if(s < 0)	s = 0;
				if(s > (props.game_width - props.sizes.paddles))	s = (props.game_width - props.sizes.paddles);

				//$("#game-output").append("b - " + state.data.ballpos.x + ", [" + (s-(props.sizes.paddles / 2)-(props.sizes.ball_radius*2)) + ", " + (s+(props.sizes.paddles / 2)+(props.sizes.ball_radius*2)) + "] " + props.start.next + "<br/>");

				if((state.data.ballpos.x >= (s-(props.sizes.paddles / 2)-(props.sizes.ball_radius*2))) && (state.data.ballpos.x <= (s+(props.sizes.paddles / 2)+(props.sizes.ball_radius*2))))
				{
					util.bounces++;
					util.dificulty_set = false;
					state.data.ballmove.y = util.getBallSpeed() * -1;

					props.start.next = "t";
				}
				else
				{
					
					console.log(state.data.ballpos.x + ", " + s);
					state.game = "gameover";
				}
			}
			//else
			//	$("#game-output").append("Dup Bottom<br/>");
		}
		else if(state.data.ballpos.y <= props.sizes.ball_radius)
		{
			if(props.start.next == "t")
			{
				var s = state.data.mousepos.x;
				if(s < 0)	s = 0;
				if(s > (props.game_width - props.sizes.paddles))	s = (props.game_width - props.sizes.paddles);

				//$("#game-output").append("t - " + state.data.ballpos.x + ", [" + (s-(props.sizes.paddles / 2)-(props.sizes.ball_radius*2)) + ", " + (s+(props.sizes.paddles / 2)+(props.sizes.ball_radius*2)) + "] " + props.start.next + "<br/>");

				if((state.data.ballpos.x >= (s-(props.sizes.paddles / 2)-(props.sizes.ball_radius*2))) && (state.data.ballpos.x <= (s+(props.sizes.paddles / 2)+(props.sizes.ball_radius*2))))
				{
					util.bounces++;
					util.dificulty_set = false;
					state.data.ballmove.y = util.getBallSpeed();

					props.start.next = "b";
				}
				else
				{
					console.log(state.data.ballpos.x + ", " + s);
					state.game = "gameover";
				}
			}
			//else
			//	$("#game-output").append("Dup Top<br/>");
		}

		cx.fillStyle = props.colors.ball;
		cx.beginPath();
		cx.arc(state.data.ballpos.x, state.data.ballpos.y, props.sizes.ball_radius, 0, 2 * Math.PI, false);
		cx.fill();

		cx.fillText(util.bounces, 100, 100);
		cx.fillText("L" + Math.ceil((util.bounces+1)/10), 100, 150);

		if(!util.dificulty_set && util.bounces != 0 && (util.bounces % 10 == 0))
		{
			props.sizes.paddles /= 1.25;
			props.sizes.ball_radius /= 1.25;
			props.speed.max *= 1.25;
			props.speed.min *= 1.25;
			util.dificulty_set = true;
		}
	}
	else if(state.game == "gameover")
	{
		clearInterval(runLoop);

		$("#game-content").remove();
		$(".game-container .before-game-screen").fadeIn("fast");
	}
}



util.bounces = 0;
util.dificulty_set = false;

util.createGame = function()
{
	var e = $(document.createElement("canvas"));
	e.attr("id", "game-content");

	e.attr("width", props.game_width);
	e.attr("height", props.game_height);

	//e.css("display", "none");

	return e;
}

util.getMousePos = function(evt)
{
	var rect = cv.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
}

util.getBallSpeed = function()
{
	return Math.floor((Math.random()*props.speed.max)+props.speed.min);
}

util.reset = function()
{
	util.bounces = 0;

	props = {
		game_width: 400,
		game_height: 400,
		frame_rate: (1/24)*1000,
		colors: {
			paddle_top: "#71A1BB",
			paddle_bottom: "#71A1BB",
			ball: "#34799E"
		},
		sizes: {
			paddles: 50,
			ball_radius: 10
		},
		start: {
			paddles: 175,
			ball: {
				x: 200,
				y: 200,
				move_x: 10,
				move_y: 8
			},
			next: "b"
		},
		speed: {
			max: 8,
			min: 6
		}
	}
}
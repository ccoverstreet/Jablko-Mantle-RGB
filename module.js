// mantle_rgb_light.js: RGB Mantle Light Controller
// Cale Overstreet
// August 20, 2020
// Controls RGB lights through an ESP8266
// Exports: 

const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");

const module_name = path.basename(__dirname);
const module_config = require(module.parent.filename).jablko_config.jablko_modules[module_name];

// Check if module_config is correct
if (module_config.controller_ip == null || module_config.controller_ip == undefined) {
	throw new Error("Incorrect Configuration");
}

var current_color = {
	r: 0,
	g: 0,
	b: 0,
	a: 0
}

module.exports.permission_level = 0;

module.exports.generate_card = async () => {
	return (await fs.readFile(`${__dirname}/mantle_rgb.html`, "utf8")).replace(/\$MODULE_NAME/g, module_name);
}

module.exports.status = async (req, res) => {
	await fetch(`http://${module_config.controller_ip}/status`)
		.then(async function(data) {
			const response = await data.json();
			if (data.status == 200) {
				current_color.r = response.r
				current_color.g = response.g
				current_color.b = response.b
				current_color.a = response.a

				res.json({status: "good", message: "Set RGBA", r: response.r, g: response.g, b: response.b, a: response.a});
			} else {
				throw new Error("Error communicating with controller");
			}
		})
		.catch(function(error) {
			console.log("Mantle RGB Light: Error communicating with controller");
			console.debug(error);

			res.json({status: "fail", message: `Error contacting controller (HTTP ERROR)`});
			return;
		});
}


module.exports.set_rgba = async (req, res) => {
	clearInterval(interval_color_cycle);

	await set_color(req.body)
		.then(async function(data) {
			if (data.status == 200) {
				res.json({status: "good", message: "Set RGBA"});
			} else {
				throw new Error("Error communicating with controller");
			}
		})
		.catch(function(error) {
			console.log("Mantle RGB Light: Error communicating with controller");
			console.debug(error);

			res.json({status: "fail", message: `Error contacting controller (HTTP ERROR)`});
			return;
		});

}

async function set_color(data) {
	current_color.r = data.r
	current_color.g = data.g
	current_color.b = data.b
	current_color.a = data.a

	return await fetch(`http://${module_config.controller_ip}/set_rgba`, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	});
}

// -------------------- START Chatbot functions --------------------

function random_int(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

module.exports.chatbot_turn_off = async () => {
	const responses = [
		"I've turned of the lights.",
		"Ok, saving the environment.",
		"LED Lights off."
	]

	clearInterval(interval_color_cycle);

	await set_color({r: 255, g: 255, b: 255, a: 0})
		.catch((error) => {
			return "Sorry, I wasn't able to turn off the LEDs";
		});

	return responses[random_int(responses.length)];
}

module.exports.chatbot_random_color = async () => {
	const responses = [
		"You asked for it.",
		"Pick a number, any number.",
		"Here's a good one"
	];

	clearInterval(interval_color_cycle);

	await set_color({r: random_int(255), g: random_int(255), b: random_int(255), a: 0.4})
		.catch((error) => {
			return "Sorry, I wasn't able to change the colors";
		});


	return responses[random_int(responses.length)];
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var interval_color_cycle = null;

module.exports.chatbot_cycle_color = async () => {
	responses = [
		"I've started the color cycling.",
		"Taste the rainbow!",
		"Party mode engaged."
	];

	if (interval_color_cycle != null) {
		return responses[random_int(responses.length)];
	} 
	
	await set_color({r: 50, g: 255, b: 130, a: 0.4});

	interval_color_cycle = setInterval(async function() {
		const damping = 0.0003;

		const new_r = Math.floor(60 * Math.sin(damping * Date.now()) + 120);
		const new_g = Math.floor(60 * Math.sin(damping * Date.now() + 2.1) + 120);
		const new_b = Math.floor(60 * Math.sin(damping * Date.now() + 4.2) + 120);

		await set_color({r: new_r, g: new_g, b: new_b, a: 0.4})
			.catch((error) => {
				console.debug(error);
			});
	}, 200);
 
	return responses[random_int(responses.length)];
}

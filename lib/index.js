var _ 					= require('lodash');
var when 				= require('when');
var mout 				= require('mout');
var moment 			 	= require('moment');
var bindHelpers         = require('./bindHelpers');
var getConnectors       = require('./getConnectors');
var bindConnectors      = require('./bindConnectors');
var isLegacyConnector 	= require('./utils/isLegacy');
var parseConfig 		= require('./parseConfig');



var Falafel = function () {

	return {
		wrap: function (options) {

			options.isLegacy = isLegacyConnector(options.directory);

			// Set the globals
			global.falafel = {};
			global._ 	   = _;
			global.when    = when;
			global.moment  = moment;
			global.mout    = mout;


			// Set the `dev` flag based on the environment variable
			if (_.isUndefined(options.dev) && (process.env.NODE_ENV === 'development')) {
				options.dev = true;
			}


			var apptalk;

			
			// LEGACY: wrap the connector files
			if (options.isLegacy) {

				// If there's a `helpers` folder, make them global functions
				// for use in the connectors without having to deal with pesky
				// `require` statements
				bindHelpers(options.directory);	

				// 2. Bind the models and make the connector actually work
				var connectorsConfig = getConnectors(options.directory);

				// Add in the file upload & download stuff
				require('./fileHandler')(options);

				// Bind the connectors and return the handler
				apptalk = bindConnectors(connectorsConfig, options);

				// If the `dev` parameter is provided, then build the
				// connectors.json file from the configuration. Running
				// things with `node-dev app.js --dev` will mean that the server will
				// restart on any change - rebuilding immediately.
				if (options.dev === true) {

					// Build the connectors json
					var buildConnectorsJson = require('./buildConnectorsJson');
					buildConnectorsJson(options.directory, connectorsConfig);
				
					// Auto generate docs
					require('./docsGenerator')(options.directory);

				}

			}


			// NEW (ARTISAN)
			else {

				// Get the raw config json from the file
				var rawConfig = require(options.directory+'/config.json');

				// Parse it into a config that Falafel can understand
				var connectorsConfig = parseConfig(rawConfig);

				// Set the helpers to the `falafel` global
				falafel.helpers = connectorsConfig[0].helpers;

				// Add in the file upload & download stuff
				require('./fileHandler')(options);

				// Bind the connectors and return the handler
				apptalk = bindConnectors(connectorsConfig, options);

			}


			// Spin up a dev server for testing via Postman on dev
			if (options.dev === true) {
				require('./devServer')(apptalk);
			}



			return apptalk;

		}

	};

};


module.exports = Falafel;


/*

	function(events, context, callback) {
	    for (var i = 0; i < events.length; i++) {
	        var event = events[i];
	        try {
	            var result = connector._messageHandlers[event.header.message](event.body, function(success) {
	                var replyMsg = {
	                    id: event.id,
	                    body: success
	                };
	                callback(null, [replyMsg]);
	            }, function(err) {
	                var replyMsg = {
	                    id: event.id,
	                    header: {
	                        error: true
	                    },
	                    body: {
	                        error_code: "unknown",
	                        message: "" + err
	                    }
	                };
	                callback(null, [replyMsg]);
	            });
	        } catch (e) {
	            var replyMsg = {
	                id: event.id,
	                header: {
	                    error: true
	                },
	                body: {
	                    error_code: "unknown",
	                    message: "" + e
	                }
	            };
	            callback(null, [replyMsg]);
	        }

	        // TODO don't handle just the first message
	        break;
	    }
	};

*/

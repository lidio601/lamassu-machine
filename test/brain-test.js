'use strict';

/*global jasmine:false */

var _ = require('lodash');
var Brain = require('../lib/brain');
var Configuration = require('../lib/configuration.js');
var State = require('../lib/constants/state.js');

describe('Brain', function() {
  var config = null;
  var brain = null;

  beforeEach(function() {
    var overrides = JSON.parse('{"_":[], "mockBTC":"1EyE2nE4hf8JVjV51Veznz9t9vTFv8uRU5", "mockBv":"/dev/pts/7", "mockTrader":true, "mockCam":true, "mockBillDispenser":true, "brain": { "checkIdle":2000, "idleTime":10000, "exitTime":20000} }');
    config = Configuration.loadConfig(overrides);

    brain = new Brain(config);
  });

  it('is created when given common dev command line overrides', function() {
    expect(brain).toBeDefined();
  });

  it('starts off in the state \'start\'', function() {
    expect(brain.state).toBe(State.START);
  });
  
  describe(', when _idle() is called', function() {
	  it(', state becomes State.PENDING_IDLE', function () {
		  spyOn(brain, '_setState');
		  
		  brain._idle();
		  
		  expect(brain._setState).toHaveBeenCalledWith(State.PENDING_IDLE);
		  expect(brain._setState.calls.count()).toEqual(1);
	  });
  });

  describe('calls a callback function once the exitOnIdle time has passed', function() {
	  var EXPECT_TO_PASS = true;
	  var EXPECT_TO_FAIL = false;
	  
	  var theTest = function(brainState, expectation) {
		    var callback = jasmine.createSpy('callback');
		    jasmine.clock().install();

		    expect(callback).not.toHaveBeenCalled();

		    jasmine.clock().mockDate();

		    brain.state = brainState;
		    brain._executeCallbackAfterASufficientIdlePeriod(callback);

		    jasmine.clock().tick(brain.config.idleTime);
		    jasmine.clock().tick(brain.config.idleTime);
		    jasmine.clock().tick(brain.config.idleTime);

		    if (expectation === undefined || expectation === EXPECT_TO_PASS)
		    	expect(callback).toHaveBeenCalled();
		    else 
		    	expect(callback).not.toHaveBeenCalled();

		    jasmine.clock().uninstall();
	  };
	  
	  // test each of the states in Brain.STATIC_STATES
	  it('when state is State.IDLE', function() {
		    theTest(State.IDLE);
	  });
	  
	  it('when state is State.PENDING_IDLE', function() {
		    theTest(State.PENDING_IDLE);
	  });

  });
  
  describe('initializes', function() {

    var func = function(arr, testFunc, testObj) {
      testFunc.call(brain);

      _.each(arr, function(el /*, idx, list*/ ) {
        var listeners = testObj.listeners(el);
        expect(listeners.length).toBe(1);
      });
    };

    it('its trader correctly', function() {
      var events = [State.POLL_UPDATE, 'networkDown', 'networkUp', 'dispenseUpdate', 'error', 'unpair'];
      func(events, brain._initTraderEvents, brain.trader);
    });

    it('its browser correctly', function() {
      var events = ['connected', 'message', 'closed', 'messageError', 'error'];
      func(events, brain._initBrowserEvents, brain.browser);
    });

    it('its wifi correctly', function() {
      var events = ['scan', 'authenticationError'];
      func(events, brain._initWifiEvents, brain.wifi);
    });

    it('its billValidator correctly', function() {
      var events = ['error', 'disconnected', 'billAccepted', 'billRead', 'billValid', 'billRejected', 'timeout', 'standby', 'jam', 'stackerOpen', 'enabled'];
      func(events, brain._initBillValidatorEvents, brain.billValidator);
    });

    it('its own event listeners correctly', function() {
      var events = ['newState'];
      func(events, brain._initBrainEvents, brain);
    });

  }); /* initializes */

}); /* Brain */

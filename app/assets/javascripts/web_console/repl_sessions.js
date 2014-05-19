//= require web-console

var AJAXTransport = (function(WebConsole) {

  var inherits = WebConsole.inherits;
  var EventEmitter = WebConsole.EventEmitter;

  var FORM_MIME_TYPE = 'application/x-www-form-urlencoded; charset=utf-8';

  var AJAXTransport = function(options) {
    EventEmitter.call(this);
    options || (options = {});

    this.url = (typeof options.url === 'string') ? {
      input: options.url,
      pendingOutput: options.url,
      configuration: options.url
    } : options.url;

    this.pendingInput  = '';

    this.initializeEventHandlers();
  };

  inherits(AJAXTransport, EventEmitter);

  // Initializes the default event handlers.
  AJAXTransport.prototype.initializeEventHandlers = function() {
    this.on('input', this.sendInput);
  };

  // Shorthand for creating XHR requests.
  AJAXTransport.prototype.createRequest = function(method, url, options) {
    options || (options = {});

    var request = new XMLHttpRequest;
    request.open(method, url);

    if (typeof options.form === 'object') {
      var content = [], form = options.form;

      for (var key in form) {
        var value = form[key];
        content.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }

      request.setRequestHeader('Content-Type', FORM_MIME_TYPE);
      request.data = content.join('&');
    }

    return request;
  };

  // Send the input to the server.
  //
  // Each key press is encoded to an intermediate format, before it is sent to
  // the server.
  //
  // WebConsole#keysPressed is an alias for WebConsole#sendInput.
  AJAXTransport.prototype.sendInput = function(input) {
    input || (input = '');

    if (this.disconnected) return;
    if (this.sendingInput) return this.pendingInput += input;

    // Indicate that we are starting to send input.
    this.sendingInput = true;

    var request = this.createRequest('PUT', this.url.input, {
      form: { input: this.pendingInput + input }
    });

    // Clear the pending input.
    this.pendingInput = '';

    var self = this;
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        self.sendingInput = false;
        if (request.status === 200) {
          self.emit('outputReceived', request.responseText);
        }
      }
    };

    request.send(request.data);
  };
}).call(this, WebConsole);

window.addEventListener('load', function() {
  var terminal = window.terminal = new WebConsole.Terminal(config.terminal);
  var transport = new AJAXTransport(config.transport);

  terminal.on('data', function(data) {
    transport.emit('input');
  });

  transport.on('outputReceived' function(response) {
    var json = JSON.parse(response);
    if (json.output) terminal.write(json.output);
  });
})

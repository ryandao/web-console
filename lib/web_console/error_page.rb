require "cgi"
require "json"

module WebConsole
  # @private
  class ErrorPage
    def self.template_path(template_name)
      File.expand_path("../templates/#{template_name}.erb", __FILE__)
    end

    def self.template(template_name)
      Erubis::EscapedEruby.new(File.read(template_path(template_name)))
    end

    attr_reader :exception, :env, :repls

    def initialize(exception, env)
      @exception = real_exception(exception)
      @console_session = ConsoleSessionREPL.create binding_from_exception
      @env = env
      @start_time = Time.now.to_f
      @repls = []
    end

    def render(template_name = "main")
      self.class.template(template_name).result binding
    end

  private
    def binding_from_exception
      @exception.__web_console_bindings_stack[0]
    end

    def real_exception(exception)
      if exception.respond_to?(:original_exception) && exception.original_exception.is_a?(Exception)
        exception.original_exception
      else
        exception
      end
    end
  end
end

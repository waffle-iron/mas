/* ************************************************************************

#asset(projectx/*)

************************************************************************ */

qx.Class.define("client.Application",
{
    extend : qx.application.Standalone,

    members :
    {
	__rpc : 0,
	
	main: function()
	{
	    this.base(arguments);
	
	    qx.log.appender.Console;
   
	    __rpc = new qx.io.remote.Rpc(
		"http://evergreen.portaali.org/svn/lisa/jsonrpc.pl",
		"qooxdoo.test"
	    );

	    loginForm = new client.Login(__rpc);
	    registrationForm = new client.Registration(__rpc);

	    loginForm.show(this.getRoot());
	}

    }
});


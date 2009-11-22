/* ************************************************************************

#asset(projectx/*)

************************************************************************ */

qx.Class.define("client.Application",
{
    extend : qx.application.Standalone,

    members :
    {
	__rpc : 0,
	
	main : function()
	{
	    this.base(arguments);
	
	    qx.log.appender.Console;

	    // install.sh changes the port
	    ralph_port = 9999; 		

	    if (ralph_port == 8080)
	    {
		ralph_domain = "http://a167.myrootshell.com";
	    }
	    else
	    {
		ralph_domain = "http://evergreen.portaali.org";
	    }

	    ralph_url = ralph_domain + ":" + ralph_port;

	    infoDialog = new client.InfoDialog();
	    logDialog = new client.LogDialog();

	    global_settings = new client.Settings("");

	    var query = window.location.search;

	    global_id = this.gup('id');
	    global_sec = this.gup('token');

	    if (this.gup('a') == "yes")
	    {
		global_anon = true;
	    }
	    else
	    {
		global_anon = false;
	    }

	    this.getRoot().removeAll();
	    MainScreenObj = new client.MainScreen(this.getRoot());
	},

	gup : function( name )
	{
	    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	    var regexS = "[\\?&]"+name+"=([^&#]*)";
	    var regex = new RegExp( regexS );
	    var results = regex.exec( window.location.href );
	    if( results == null )
		return "";
	    else
		return results[1];
	}
    }
});


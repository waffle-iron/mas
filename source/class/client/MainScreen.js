/* ************************************************************************

#asset(projectx/*)

************************************************************************ */

qx.Class.define("client.MainScreen",
{
    extend : qx.core.Object,

    construct : function(rootItem)
    {
	this.base(arguments);

	this.windows = new Array();

	// read "socket"
	this.__rrpc = new qx.io.remote.Rpc("/ralph", "ralph");
	this.__rrpc.setTimeout(30000);

	//global because of call from LogDialog, not optimal
	var d = new Date();
	global_offset = d.getTimezoneOffset();

        this.__timer = new qx.event.Timer(1000 * 60);
        this.__timer.start();

        this.__topictimer = new qx.event.Timer(1000);

	this.__topictimer.addListener(
	    "interval", function(e) {
		//there seems to be bug in qooxdoo, one event can come after the timer is stopped
		if (this.__topictimeractive == true)
		{
		    if (this.__topicstate == 0)
		    {
			document.title = "[NEW] MeetAndSpeak";
			this.__topicstate = 1;
		    }
		    else
		    {
			document.title = "[MSG] MeetAndSpeak";
			this.__topicstate = 0;
		    }
		}
		else
		{
		    document.title = "MeetAndSpeak";
		}
	    }, this);

	this.__tt = new qx.ui.tooltip.ToolTip("Send Message");
	this.__myapp = rootItem;

	//Initial hello, send TZ info
	this.__rrpc.callAsync(
	    qx.lang.Function.bind(this.readresult, this), "HELLO",
	    global_ids + this.seq + " " + global_offset);

	qx.bom.Element.addListener(window, "focus", function(e) { 
	    this.__blur = 0;
	    this.__topictimeractive = false;
	    if (this.__topictimeractive == true)
	    {
		this.__topictimer.stop();
	    }

	    if (this.windows[this.activewin])
	    {
		this.windows[this.activewin].activatewin();
	    }

	    document.title = "MeetAndSpeak";
	}, this);

	qx.bom.Element.addListener(window, "blur", function(e) { 
	    this.__blur = 1;
	}, this);

	FlashHelper =
	    {
		movieIsLoaded : function (theMovie)
		{
		    if (typeof(theMovie) != "undefined" && typeof(theMovie.PercentLoaded) == "function")
		    {
			return theMovie.PercentLoaded() == 100;
		    }
		    else 
		    {
			return false;
		    }
		},

		getMovie : function (movieName)
		{
		    if (navigator.appName.indexOf ("Microsoft") !=-1)
		    {
			return window[movieName];
		    }
		    else
		    {
			return document[movieName];
		    }
		}
	    };
    },

    members :
    {
        __rrpc : 0,
	__part2 : 0,
	__part3 : 0,
	__windowGroup : 0,
	__error : 0,
	manager : 0,
	__myapp : 0,
        __timer : 0,
        __topictimer : 0,
	__topicstate : 0,
	__ack : 0,
	__tt : 0,
	__blur : 0,
	__firstrpc : 1,
	__input1 : 0,
	__topictimeractive : 0,
	activewin : 0,
	__prevwin : -1,
	__msgvisible : 0,
	initdone : 0,
	rootContainer : 0,
	seq : 0,
	windows : null,
	showads : 1,
	desktop : 0,
	contactsButton : 0,

	sendresult : function(result, exc) 
	{
	    if (exc == null) 
	    {
		//Remove num of commands, should be always 1 to this case
		//TODO: Common parts with readresult() should investigated
		
		//TODO: BIG HACK -> fix the protocol!!!
		if (result.charAt(0) == "1")
		{
		    result = result.substr(2);
		}

                var pos = result.search(/ /);
                var command = result.slice(0, pos);
                var param = result.slice(pos+1);
                
		switch(command)
		{
		    
		case "DIE" :
		    infoDialog.showInfoWin("Session terminated. <p>Press OK to restart.",
					   "OK", function () {
					       qx.bom.Cookie.del("ProjectEvergreen");
					       window.location.reload(true);
					   });
		    break;
		    
		case "OK" :
		    break;

		case "INFO" :
		    infoDialog.showInfoWin(param, "OK");
		    break;
		}
	    }
	    else 
	    {
		infoDialog.showInfoWin("Lost connection to server.<p>Trying to recover...");

		qx.event.Timer.once(function(e){
		    window.location.reload(true);
		}, this, 2000);
	    }
	},

	readresult : function(result, exc) 
	{
	    var doitagain = true;

	    this.seq++;

	    if (exc == null) 
	    {
		this.__error = 0;
		this.__firstrpc = 0;

		var initialpos = result.search(/ /);
		var ack = result.slice(0, initialpos);
		var allcommands = result.slice(initialpos+1);

		if (ack == 1)
		{
		    this.__ack = 1;
		}
		else
		{
		    this.__ack++;
		    if (this.__ack != ack)
		    {
			if (this.desktop === 0)
			{
			    this.show();
			}

			infoDialog.showInfoWin("Connection error.<p>Trying to recover...");

			qx.event.Timer.once(function(e){
			    window.location.reload(true);
			}, this, 2000);
		    }
		}

		var commands = allcommands.split("<>");

		for (var i=0; i < commands.length; i++)
		{
		    var pos = commands[i].search(/ /);
		    var command = commands[i].slice(0, pos);
		    var param = commands[i].slice(pos+1);

		    pos = param.search(/ /);
		    var window_id = param.slice(0, pos);
		    
		    //alert ("handling:" + command + param);

		    switch(command)
		    {

		    case "COOKIE":
			var options = param.split(" ");
			global_tmpcookie = options.shift();
			global_ids = global_id + " " + global_sec + " " + global_tmpcookie + " ";
			break;

		    case "CREATE":
			var options = param.split(" ");
			this.create_or_update_window(options, true);
			break;

		    case "UPDATE":
			var options = param.split(" ");
			this.create_or_update_window(options, false);
			break;

		    case "INITDONE":
			this.initdone = 1;
			var group = qx.bom.Cookie.get("ProjectEvergreenJoin");
			var that = this;
			if (group != null)
			{
			    var data = group.split("-");

			    qx.bom.Cookie.del("ProjectEvergreenJoin");
			    infoDialog.showInfoWin("Do you want to join the group " + data[0] + "?", "Yes", 
						   function()
						   {
						       that.__rrpc.callAsync(
							   qx.lang.Function.bind(that.sendresult, that), "JOIN",
							   global_ids + data[0] + " MeetAndSpeak " + data[1]);
						   }, "NO");
			}
			
			break;

		    case "ADDTEXT":
			var options = param.split(" ");
			var window_id = parseInt(options.shift());
			var type = parseInt(options.shift());
			var usertext = options.join(" ");

			usertext = this.adjustTime(usertext);
			this.windows[window_id].addline(usertext);

			if (this.windows[window_id].sound == 1)
			{
			    this.player_start();
			}

			if (this.__blur == 1 && this.windows[window_id].titlealert == 1 &&
			    this.__topictimer.getEnabled() == false)
			{
			    this.__topictimeractive = true;
			    this.__topictimer.start();
			} 

			if (this.activewin.winid != window_id && this.initdone == 1)
			{
			    if (type == 1 && this.windows[window_id].isRed == false)
			    {
				this.windows[window_id].setGreen();
			    }
			    else if (type == 2)
			    {
				this.windows[window_id].setRed();
			    }
			    //else don't change color
			}
			break;

		    case "REQF":
			var options = param.split(" ");
		    	var friend_id = parseInt(options.shift());
			var friend_nick = options.shift();
			var friend_name = options.join(" ");

			if (this.__msgvisible == false)
			{
			    this.msg = new qx.ui.container.Composite(
				new qx.ui.layout.HBox(8));
			    this.msg.setPadding(5, 15, 5, 15);
			    this.msg.set({ backgroundColor: "yellow"});

			    this.msg.add(new qx.ui.basic.Label(
				friend_name + " (" + friend_nick + ") wants to be your friend. Is this OK?"));

			    var accept = new qx.ui.basic.Label("<font color=\"blue\">ACCEPT</font>");
			    var decline = new qx.ui.basic.Label("<font color=\"blue\">DECLINE</font>");
			    accept.setRich(true);
			    decline.setRich(true);

			    accept.addListener("click", function () {
				this.__rrpc.callAsync(
				    qx.lang.Function.bind(this.sendresult, this),
				    "OKF", global_ids +	friend_id);
				//TODO: this relies on proper carbage collection
				this.rootContainer.remove(this.msg);
				this.__msgvisible = false;
			    }, this);

			    decline.addListener("click", function () {
				this.__rrpc.callAsync(
				    qx.lang.Function.bind(this.sendresult, this),
				    "NOKF", global_ids + friend_id);
				//TODO: this relies on proper carbage collection
				this.rootContainer.remove(this.msg);
				this.__msgvisible = false;
			    }, this);

			    this.msg.add(accept);
			    this.msg.add(decline);
			    
			    this.__msgvisible = true;

			    this.rootContainer.addAt(this.msg, 1, {flex:0});
			}
			// else ignore command

			break;
   
		    case "TOPIC":
		    	var usertext = param.slice(pos+1);
			this.windows[window_id].changetopic(usertext);
			break;

		    case "NAMES":
			// "clever" sort hack
		    	var usertext = param.slice(pos+1).replace(/\@/g, "*");
			this.windows[window_id].nameslist = usertext.split(" ").sort(function(x,y){ 
			    var a = String(x).toUpperCase(); 
			    var b = String(y).toUpperCase(); 
			    if (a > b)
			    { 
				return 1;
			    }
			    else if (a < b) 
			    {
				return -1; 
			    }
			    else
			    {
				return 0; 
			    }
			}); 

			this.windows[window_id].addnames(true);
			break;

		    case "ADDNAME":
			var options = param.split(" ");
		    	var windowid = parseInt(options.shift());
		    	options.shift(); // obsolete parameter
		    	var nick = options.shift();
			this.windows[windowid].addname(nick);
			break;

		    case "DELNAME":
		    	var usertext = param.slice(pos+1);
			this.windows[window_id].delname(usertext);
			break;

		    case "NICK":
			global_nick = param.split(" ");
			break;

		    case "A":
			var options = param.split(" ");
			this.showads = options.shift();
			break;

		    case "ADDURL":
			var options = param.split(" ");
		    	var windowid = parseInt(options.shift());
			var url = options.shift();
			this.windows[windowid].addUrl(url);
			break;

		    case "DIE":
		    	if (this.desktop === 0)
			{
			    this.show();
			}
			infoDialog.showInfoWin(
			    "Protocol Error. <p>Press OK to login again.",
			    "OK", 
			    function () {
				qx.bom.Cookie.del("ProjectEvergreen");
				window.location.reload(true);
			    });
			doitagain = false;
			break;
						
		    case "EXPIRE":
		    	if (this.desktop === 0)
			{
			    this.show();
			}

			//var reason = param.slice(pos+1);
			infoDialog.showInfoWin(
			    "Your session expired, you logged in from another location, or<br>the server was restarted.<p>Press OK to restart.",
			    "OK", 
			    function () {
				window.location.reload(true);
			    });
			doitagain = false;
			break;

		    case "OK" :
			break;

		    case "INFO" :
			infoDialog.showInfoWin(param, "OK");
			break;

		    case "CLOSE":
			var window_id = param.slice(pos+1);
			this.removeWindowButton(window_id);			
			//TODO: call destructor?
			delete this.windows[window_id];
			break;

		    case "FLIST":
			this.updateFriendsList(globalflist, param);
			break;

		    case "SET":
			global_settings = new client.Settings(param);
			//We have settings now, ready to draw main screen
			this.show();
			break;
		    }
		}

		if (doitagain == true)
		{
		    this.__rrpc.callAsync(
			qx.lang.Function.bind(this.readresult, this),
			"HELLO", global_ids + this.seq);
		}
	    }
	    else 
	    {
		if (this.__firstrpc == 1)
		{
		    alert("MeetAndSpeak is having some technical problems. Sorry!\n\nYou can try to reload this page in a few moments to see if the service is back online.\n\nWe are trying to address the situation as quickly as possible.");
		}
		else
		{

		    //Wait a little and try again. This is to make sure
		    //that we don't loop and consume all CPU cycles if
		    //there is no connection.
		    this.__error++;
		    
		    //TODO: Does not work, long idle time, no errors and we are here
		    //if (this.__error > 15)
		    //{
		    //time to give up
		    //infoDialog.showInfoWin("Lost connection to server.<p>Trying to recover...");
		    
		    //qx.event.Timer.once(function(e){
		    //	window.location.reload(true);
		    //   }, this, 2000);
		    //}
		//else
		//{
		    qx.event.Timer.once(function(e){
			this.__rrpc.callAsync(
			    qx.lang.Function.bind(this.readresult, this),
			    "HELLO", global_ids + this.seq);
		    }, this, 2000); 
		}
		//}
	    }
	},

	create_or_update_window : function(options, create)
	{
	    var window_id = options.shift();
	    var x = parseInt(options.shift());
	    var y = parseInt(options.shift());
	    var width = parseInt(options.shift());
	    var height = parseInt(options.shift());
	    var nw = options.shift();
	    var nw_id = options.shift();
	    var name = options.shift();
	    var type = parseInt(options.shift());
	    var sound = parseInt(options.shift());
	    var titlealert = parseInt(options.shift());
	    var usermode = parseInt(options.shift());
	    var visible = parseInt(options.shift());
	    var new_msgs = parseInt(options.shift());
	    var pwset = parseInt(options.shift());

	    var password = "";

	    if (pwset == 1)
	    {
		password = options.shift();
	    }
	    
	    var topic = options.join(" ");

	    if (create == true)
	    {
		var newWindow = 
		    new client.UserWindow(this.desktop,
					  topic, nw, name, type, sound, titlealert,
					  nw_id, usermode, password, new_msgs);

		if (x < 0)
		{
		    x = 0;
		}
		
		if (y < 0)
		{
		    y = 0;
		}

		if (height == -1)
		{
		    var myWidth = 0, myHeight = 0;
		    
		    //horror, for some reason getBounds doesn't work for 1st anon window
		    if( typeof( window.innerWidth ) == 'number' ) 
		    {
			//Non-IE
			myWidth = window.innerWidth;
			myHeight = window.innerHeight;
		    } 
		    else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) 
		    {
			//IE 6+ in 'standards compliant mode'
			myWidth = document.documentElement.clientWidth;
			myHeight = document.documentElement.clientHeight;
		    }
		    else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) 
		    {
			//IE 4 compatible
			myWidth = document.body.clientWidth;
			myHeight = document.body.clientHeight;
		    }

		    //anonymous user
		    height = Math.round(myHeight * 0.7);
		    width = Math.round(myWidth * 0.7);
		}

		var dim = this.desktop.getBounds();		

		if (dim && x + width > dim.width)
		{
		    if (width < dim.width)
		    {
			x = dim.width - width;
		    }
		    else
		    {
			x = 5;
			width = dim.width - 10;
		    }
		}
		
		if (dim && y + height > dim.height)
		{
		    if (height < dim.height)
		    {
			y = dim.height - height;
		    }
		    else
		    {
			y = 5;
			height = dim.height - 10;
		    }
		}

		newWindow.moveTo(x, y);	
		newWindow.setHeight(height);
		newWindow.setWidth(width);

		newWindow.winid = window_id;
		this.windows[window_id] = newWindow;

		this.addWindowButton(window_id, new_msgs);
	
		newWindow.show();
		
		//Keep these two last
		if (visible == 0)
		{
		    //Qooxdoo bug propably, therefore first show and then hide.
		    newWindow.hide();
		}

		newWindow.addHandlers();

		this.activewin = window_id;
	    }
	    else
	    {
		if (this.windows[window_id])
		{
		    this.windows[window_id].updateValues(
			topic, nw, name, type, sound, titlealert,
			nw_id, usermode, password);
		}
	    }
	},

	adjustTime : function(text)
	{
	    var myRe = /<(\d+)>/g;

	    return text.replace(
		myRe, 
		function(m)
		{
		    var mytime = parseInt(m.substring(1, m.length-1)) - global_offset;
		    if (mytime < 0)
		    {
			mytime = 1440 + mytime;
		    }
		    if (mytime > 1440)
		    {
			mytime = mytime - 1440;
		    }
		    
		    var hour = Math.floor(mytime / 60);
		    var min = mytime % 60;
		    
		    if (min < 10)
		    {
			min = "0" + min;
		    }
		    
		    if (hour < 10)
		    {
			hour = "0" + hour;
		    }
		    
		    return hour + ":" + min;
		});
	},
	
	show : function()
	{
	    /* Root widget */
	    this.rootContainer = new qx.ui.container.Composite(
		new qx.ui.layout.VBox(0));

	    this.rootContainer.set({ backgroundColor: "#717172", padding:10});
	    this.rootContainer.add(this.getMenuBar());
	    
	    /* middle */
	    var windowManager = new qx.ui.window.Manager();
	    this.manager = windowManager;

	    var middleSection = new qx.ui.container.Composite(
		new qx.ui.layout.HBox(0));

	    //desktop
	    var middleContainer = new qx.ui.window.Desktop(windowManager);

	    middleContainer.addListener("resize", this.checkLimits,this);

	    this.desktop = middleContainer;

	    middleContainer.set({decorator: "background2",
				 backgroundColor: "#DFE5E5"});
	    middleSection.add(middleContainer, {flex:1});

	    //ads
	    if (this.showads == 1)
	    {
		var iframe = new qx.ui.embed.Iframe("/iframe_part_from_google.html");
		iframe.set({ alignY:"middle", height: 605, width: 120, decorator : null });
		middleSection.add(iframe);
	    }

	    var friendScroll = new qx.ui.container.Scroll();

	    var friendContainer = new qx.ui.container.Composite(
		new qx.ui.layout.VBox());
	    friendContainer.set({ backgroundColor: "#F2F5FE"}); 
	    
	    var friendsLabel = new qx.ui.basic.Label("<b>Contact list:</b>");
            friendsLabel.setRich(true);
	    friendsLabel.setPaddingTop(10);
	    friendsLabel.setPaddingBottom(10);
	    friendsLabel.setPaddingLeft(10);
            
            friendContainer.add(friendsLabel);
	    	    
	    globalflist = new qx.ui.container.Composite(new qx.ui.layout.Grid());
	    globalflist.setAllowGrowY(true);
	    
	    friendContainer.add(globalflist, {flex: 1});

	    var addContainer = new qx.ui.container.Composite(
		new qx.ui.layout.HBox());

	    this.__input1 = new qx.ui.form.TextField();
	    this.__input1.setPlaceholder("<nickname>");
	    this.__input1.setMarginBottom(8);
	    this.__input1.setMarginLeft(8);

	    addContainer.add(this.__input1, {flex: 1});
	    addContainer.add(new qx.ui.core.Spacer(8));

	    var button1 = new qx.ui.form.Button("Add");
	    button1.setMarginBottom(8);
	    button1.setMarginRight(8);
	    addContainer.add(button1);

	    friendContainer.add(addContainer);

	    button1.addListener("execute", function (e) {
		this.__rrpc.callAsync(
		    this.sendresult,
		    "ADDF", global_ids + this.__input1.getValue());
		this.__input1.setValue("");
	    }, this);

	    this.rootContainer.add(middleSection, {flex:1});		
	    
	    // create the toolbar
	    toolbar = new qx.ui.toolbar.ToolBar();
	    toolbar.set({ maxHeight : 40, spacing : 30 });
	    
	    // create and add Part 1 to the toolbar
	    this.__part2 = new qx.ui.toolbar.Part();
	    this.__part3 = new qx.ui.toolbar.Part();
	    
	    toolbar.add(this.__part2);
	    toolbar.addSpacer();

	    //popup
	    var contactsPopup = new qx.ui.popup.Popup(new qx.ui.layout.HBox(5));
	    contactsPopup.set({ autoHide : false, height : 500, width : 250 });

	    friendScroll.add(friendContainer);
	    friendScroll.set({
		scrollbarX : "auto",
		scrollbarY : "auto"
	    });

	    contactsPopup.add(friendScroll, {flex : 1});

	    if (global_anon == false)
	    {
		var contactsButton = new qx.ui.toolbar.CheckBox("<font color=\"#cccccc\">Show Contacts</font>");
		contactsButton.setRich(true);
		this.contactsButton = contactsButton;

		this.__part3.add(contactsButton);	
    
		contactsButton.setValue(false);

		contactsButton.addListener("changeValue", function (e) {
		    if (e.getData() == true)
		    {
			contactsPopup.placeToWidget(contactsButton);
			contactsPopup.show();
		    }
		    else
		    {
			contactsPopup.hide();
		    } 
		}, middleSection);
		
		this.__timer.addListener(
		    "interval", function(e) { this.updateIdleTimes(globalflist); },
		    this);
	    
	    	toolbar.add(this.__part3);
	    }

	    this.rootContainer.add(toolbar);
	    this.__myapp.add(this.rootContainer, {flex : 1, edge: 0}); //, {padding : 10});	    

	    this.__windowGroup = new client.RadioManager();
//	    this.__windowGroup.addListener("changeSelection",
//					   this.switchToWindow, this);
	},

	updateFriendsList : function(parentFList, allFriends)
        {
	    parentFList.removeAll();
	    
	    var myfriends = allFriends.split("||");
	    
	    if (allFriends != "")
	    {
		for (var i=0; i < myfriends.length; i++)	
		{
	            var columns = myfriends[i].split("|");
		    
                    var friend = new qx.ui.basic.Label("<b>" + columns[1] +
						       "</b> (" + columns[3] + ")");
                    var friend2 = new qx.ui.basic.Label();
                    
                    var friend3 = new qx.ui.basic.Label();
		    friend3.setRich(true);	
		    friend3.setValue("<font color=\"green\">|M|</font>");
		    friend3.nickname = columns[3];
		    friend3.rrpc = this.__rrpc;
		    friend3.result = this.sendresult;
		    
		    friend3.addListener("click", function (e) {
			this.rrpc.callAsync(
			    this.result,
			    "STARTCHAT", global_ids + "MeetAndSpeak " + this.nickname);
		    }, friend3);
		    
		    friend3.addListener("mouseover", function (e) {
			this.setValue("<font color=\"green\"><b>|M|<b></font>");
		    }, friend3);
		    
		    friend3.addListener("mouseout", function (e) {
		    this.setValue("<font color=\"green\">|M|</font>");
		    }, friend3);

		    friend3.setToolTip(this.__tt);
		    
                    friend2.setRich(true);
                    friend.setRich(true);
		    
		    friend.setPaddingTop(7);
		    friend3.setPaddingTop(7);

		    friend2.setPaddingTop(0);
		    friend2.setPaddingLeft(20);
		    friend3.setPaddingLeft(10);
		    friend.setPaddingLeft(10);
	            friend2.idleTime = columns[0]; 
		
                    parentFList.add(friend, {row: 2*i, column: 0});
                    parentFList.add(friend2, {row: 2*i+1, column: 0, colSpan : 2});
                    parentFList.add(friend3, {row: 2*i, column: 1});
		}
	    }
	    else
	    {
		var nofriends = new qx.ui.basic.Label("No friends added<p>You can add new contacts by<br> using the field below<br>or by right-clicking <br>a name in any group window.<p>You can send messages <br>and see status information<br> of your friends.");
		nofriends.setRich(true);

		nofriends.setPaddingLeft(10);
		parentFList.add(nofriends, {row: 0, column: 0});
	    }

	    this.printIdleTimes(parentFList);
        }, 

        printIdleTimes : function(parentFList)
        {
            var children = parentFList.getChildren();
	    var online = 0;

            for (var i=1; i < children.length; i = i + 3)
            {
	        var idle = children[i].idleTime;
                var result;
		
		if (idle == 0)
                {
		    result = "<font color=\"green\">ONLINE<font>";
		    online++;
                }
                else if (idle < 60)
                {			
                    result = "<font color=\"blue\">Last activity: " + idle +
			" minutes ago</font>";
                }
		else if (idle < 60 * 24)
                {  
	            idle = Math.round(idle / 60);
		    if (idle == 0)
		    {
			idle = 1;
		    }

                    result = "<font color=\"blue\">Last activity: " + idle +
			" hours ago</font>";
                }
		else if (idle < 5000000)
                {  
	            idle = Math.round(idle / 60 / 24);
		    if (idle == 0)
		    {
			idle = 1;
		    }

                    result = "<font color=\"blue\">Last activity: " + idle +
			" days ago</font>";
                }
		else
		{
		    result = "<font color=\"blue\">Last activity:</font> Unknown";
		}
		
		children[i].setValue(result);
            }	

	    var onlineText = "";

	    if (online > 0)
	    {
		onlineText = " (Online: " + online + ")";
	    }

	    this.contactsButton.setLabel("<font color=\"#cccccc\">Show contacts" + onlineText + "</font>"); 
        },

	checkLimits : function(e)
	{
	    for (var i=0; i < this.windows.length; i++)
            {
		if (typeof(this.windows[i]) != 'undefined')
		{
		    var wbounds = this.windows[i].getBounds();
		    var dim = e.getData();
		    var x = wbounds.left;
		    var y = wbounds.top;
		    var width = wbounds.width;
		    var height = wbounds.height;
		    
		    if (x + width > dim.width)
		    {
			if (width < dim.width)
			{
			    x = dim.width - width;
			}
			else
			{
			    x = 5;
			    width = dim.width - 10;
			}
		    }
		    
		    if (y + height > dim.height)
		    {
			if (height < dim.height)
			{
			    y = dim.height - height;
			}
			else
			{
			    y = 5;
			    height = dim.height - 10;
			}
		    }

		    if (x != wbounds.left || y != wbounds.top)
		    {
			this.windows[i].moveTo(x, y);
		    }

		    if (width != wbounds.width)
		    {
			this.windows[i].setWidth(width);
		    }
		    
		    if  (height != wbounds.height)
		    {
			this.windows[i].setHeight(height);
		    }
		}
	    }	
	},
	    
        updateIdleTimes : function(parentFList)
        {
            var children = parentFList.getChildren();
	    
            for (var i=0; i < children.length; i++)
            {
		if (children[i].idleTime != 0)
		{
		    children[i].idleTime++;
		}
            }	

	    this.printIdleTimes(parentFList);
        },

	removeWindowButton : function(winid)
	{
	    if (this.windows[winid])
	    {
		this.__windowGroup.remove(this.windows[winid].taskbarControl);
		this.__part2.remove(this.windows[winid].taskbarButton);
	    }
	},

	addWindowButton : function(winid, new_msgs)
	{
	    if (this.windows[winid])
	    {
		var item = new qx.ui.toolbar.RadioButton();
		item.winid = winid;
		item.mainscreenobj = this;

		item.addListener("click", function () {
		    if (winid != this.__prevwin)
		    {
			this.switchToWindow(winid);
		    }
		    else if (winid == this.__prevwin && this.windows[winid].hidden == true)
                    {
                        this.windows[winid].show();
                    }
                    else if (winid == this.__prevwin)
                    {
                        this.windows[winid].hide();
                    }
		    this.__prevwin = winid;
		}, this);

		// Link from window object to its taskbarbutton.
		this.windows[winid].taskbarButton = item;
		this.windows[winid].taskbarControl = this.__windowGroup;
		item.setRich(true);
		
		this.__part2.add(item);
		this.__windowGroup.add(item);
		this.__windowGroup.setSelection([item]);

		if (new_msgs == 1)
		{
		    this.windows[winid].setGreen();
		}
		else if (new_msgs == 2)
		{
		    this.windows[winid].setRed();
		}
		else if (new_msgs == 0)
		{
		    this.windows[winid].setNormal();
		}
	    }

	    this.activewin = winid;
	    this.windows[winid].activatewin();
	},

	activateNextWin : function(direction)
	{
	    if (direction == "up")
	    {
		this.__windowGroup.selectNext();
	    }
	    else
	    {
		this.__windowGroup.selectPrevious();
	    }
	},

	switchToWindow : function(e)
	{
//	    var i = (e.getData()[0]).winid;
	    var i = e;

	    if (this.windows[i])
	    {
		this.windows[i].show();
		this.windows[i].setNormal();
		this.activewin = i;
		this.windows[i].activatewin();
	    }
	},

	getMenuBar : function()
	{
	    var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);

	    var menubar = new qx.ui.menubar.MenuBar;
	    menubar.setAllowGrowX(true);
	    menubar.set({decorator: "menu2", textColor : "#cccccc"});

	    frame.add(menubar);

	    var forumMenu = new qx.ui.menubar.Button("Groups", null,
						     this.getForumMenu());
	    var viewMenu = new qx.ui.menubar.Button("View", null,
						    this.getViewMenu());
	    var settingsMenu = new qx.ui.menubar.Button("Settings", null,
						    this.getSettingsMenu());
	    var advancedMenu = new qx.ui.menubar.Button("Advanced", null,
							this.getAdvancedMenu());
	    var helpMenu = new qx.ui.menubar.Button("Help", null, this.getHelpMenu());
	    var logoutMenu = new qx.ui.menubar.Button("Log Out", null,
						      this.getLogoutMenu());

	    if (global_anon == false)
	    {
		menubar.add(forumMenu);
		menubar.add(viewMenu);
		menubar.add(settingsMenu);
		menubar.add(advancedMenu);
	    }
	    menubar.add(helpMenu);
	    menubar.add(logoutMenu);

	    return frame;
	},

	getLogoutMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var logoutButton = new qx.ui.menu.Button("Log out",
						     "icon/16/actions/edit-undo.png");
	    menu.add(logoutButton);
	    logoutButton.addListener("execute", this._logoutCommand, this);

	    return menu;
	},

	getHelpMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var manualButton = new qx.ui.menu.Button("Support Web site");
	    var aboutButton = new qx.ui.menu.Button("About...");

	    manualButton.addListener("execute", this._manualCommand, this);
	    aboutButton.addListener("execute", this._aboutCommand, this);

	    menu.add(manualButton);
	    menu.addSeparator();
	    menu.add(aboutButton);

	    return menu;
	},

	getForumMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var createButton = new qx.ui.menu.Button("Create new group...");
	    var joinButton = new qx.ui.menu.Button("Join existing group...");

	    createButton.addListener("execute", this._createForumCommand, this);
	    joinButton.addListener("execute", this._joinForumCommand, this);

	    menu.add(createButton);
	    menu.add(joinButton);

	    return menu;
	},

	getViewMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var logsButton = new qx.ui.menu.Button("Log history...");

	    logsButton.addListener("execute", this._logsCommand, this);

	    menu.add(logsButton);

	    return menu;
	},

	getSettingsMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var sslButton = new qx.ui.menu.CheckBox("Always use HTTPS");

	    if (global_settings.getSslEnabled() == 1)
	    {
		sslButton.setValue(true);
	    }

	    sslButton.addListener("changeValue", this._sslCommand, this);
	    menu.add(sslButton);

	    return menu;
	},

	getAdvancedMenu : function()
	{
	    var menu = new qx.ui.menu.Menu;
	    var joinButton = new qx.ui.menu.Button("Join IRC channel...");

	    joinButton.addListener("execute", this._joinIRCCommand, this);
	    menu.add(joinButton);

	    return menu;
	},

	_joinIRCCommand : function(app)
	{
	    infoDialog.getJoinNewChannelWin(this.__myapp, 1);
	},

	_logsCommand : function(app)
	{
	    logDialog.show(this.__myapp, this.desktop.getBounds());
	},

	_joinForumCommand : function(app)
	{
	    infoDialog.getJoinNewChannelWin(this.__myapp, 0);
	},

	_createForumCommand : function()
	{
	    infoDialog.getCreateNewGroupWin(this.__myapp, 0);
	},

	_sslCommand : function(e)
	{
	    var usessl = e.getData();

	    if (usessl == true)
	    {
		global_settings.setSslEnabled(1);
		qx.bom.Cookie.set("UseSSL", "Yep", 100, "/");
	    }
	    else
	    {
		global_settings.setSslEnabled(0);
		qx.bom.Cookie.del("UseSSL");
	    }

	    infoDialog.showInfoWin("The application is now being reloaded to activate<br> the change.", "OK", function() {
		window.location.reload(true);
	    });
	},

	_logoutCommand : function()
	{
	    this.__rrpc.callAsync(function() {
		qx.bom.Cookie.del("ProjectEvergreen");
		window.location.reload(true);
	    }, "LOGOUT", global_ids);
	},

	_manualCommand : function()
	{
	    var newWindow = window.open("/support.html", '_blank');
	    newWindow.focus();
	},

	_aboutCommand : function()
	{
	    infoDialog.showInfoWin("<b>MeetAndSpeak Client SW 12.7.3</b><p>&copy; 2010 MeetAndSpeak. All rights reserved.", "OK");
	},
	
	player_start : function()
	{
	    var obj = FlashHelper.getMovie('niftyPlayer1');
	    if (!FlashHelper.movieIsLoaded(obj)) 
	    {
		return;
	    }
	    obj.TCallLabel('/','play');
	},

	player_stop : function()
	{
	    var obj = FlashHelper.getMovie(name);
	    if (!FlashHelper.movieIsLoaded(obj))
	    {
		return;
	    }
	    obj.TCallLabel('/','stop');
	},

	player_pause : function()
	{
	    var obj = FlashHelper.getMovie(name);
	    if (!FlashHelper.movieIsLoaded(obj))
	    {
		return;
	    }
	    obj.TCallLabel('/','reset');
	},
	
	player_load : function(url)
	{
	    var obj = FlashHelper.getMovie(name);
	    if (!FlashHelper.movieIsLoaded(obj))
	    {
		return;
	    }
	    obj.SetVariable('currentSong', url);
	    obj.TCallLabel('/','load');
	},
	    
	player_get_state : function ()
	{
	    //var obj = FlashHelper.getMovie(name);
	    //var ps = obj.GetVariable('playingState');
	    //var ls = obj.GetVariable('loadingState');
		
	    // returns
	    //   'empty' if no file is loaded
	    //   'loading' if file is loading
	    //   'playing' if user has pressed play AND file has loaded
	    //   'stopped' if not empty and file is stopped
	    //   'paused' if file is paused
	    //   'finished' if file has finished playing
	    //   'error' if an error occurred
	    // if (ps == 'playing')
	    //	if (ls == 'loaded') return ps;
	    //   else return ls;
	    
	    //  if (ps == 'stopped')
	    //		if (ls == 'empty') return ls;
	    //    if (ls == 'error') return ls;
	    //   else return ps;
	    
	    //    return ps;
		
	}
    }
});


/* ************************************************************************

#asset(projectx/*)

************************************************************************ */

qx.Class.define("client.Login",
{
    extend : qx.core.Object,

    construct : function(rpcref)
    {
        __myrpc = rpcref;
    },

    members :
    {
	wm1 : 0,
        __myrpc : 0,

	result : function()
	{


	},

	checkInput : function()
	{
	    this.__myrpc.callAsync(this.result, "login", "Testi");
	},

	show : function(rootItem)
	{

	    /* Layout for root */
	    var rootLayout = new qx.ui.layout.VBox();
	    rootLayout.setSpacing(25); // apply spacing

	    /* Root widget */
	    rootContainer = new qx.ui.container.Composite(rootLayout);

	    rootContainer.addListener(
		"resize", function(e)
		{
		    var bounds = rootContainer.getBounds();
		    rootContainer.set({
			marginTop: Math.round(-bounds.height / 2),
			marginLeft : Math.round(-bounds.width / 2)
		    });
		}, this); 

	    /* Layout for members box */
	    var layout = new qx.ui.layout.Grid(9, 5);
	    layout.setColumnAlign(0, "right", "top");
	    layout.setColumnAlign(2, "right", "top");
	    
	    /* Members box widget */
	    this.__box1 = new qx.ui.groupbox.GroupBox("Existing users:").set({
		contentPadding: [16, 16, 16, 16]
	    });
	    this.__box1.setLayout(layout);
	    
	    rootContainer.add(this.__box1);

	    /* Labels */
	    var labels = ["Nick name:", "Password:"];
	    for (var i=0; i<labels.length; i++) {
		this.__box1.add(new qx.ui.basic.Label(labels[i]).set({
		    allowShrinkX: false,
		    paddingTop: 3
		}), {row: i, column : 0});
	    }
	    
	    /* Text fields */
	    var field1 = new qx.ui.form.TextField();
	    var field2 = new qx.ui.form.PasswordField();

	    this.__box1.add(field1.set({
		allowShrinkX: false, paddingTop: 3
	    }), {row: 0, column : 1});
	    
	    this.__box1.add(field2.set({
		allowShrinkX: false, paddingTop: 3
	    }), {row: 1, column : 1});
	    
	    /* Button */
	    var button1 = this.__okButton =  new qx.ui.form.Button("Login");
	    button1.setAllowStretchX(false);

	    this.__box1.add(button1,{ row : 3, column : 1 });
	    
	    /* Check input on click */
	    button1.addListener("execute", this.checkInput, this);

	    /* Layout for register box */
            var layout2 = new qx.ui.layout.VBox();

	    /* Register box widget */
	    this.__box2 = new qx.ui.groupbox.GroupBox("New members:").set({
		contentPadding: [16, 16, 16, 16]
	    });
	    this.__box2.setLayout(layout2);

	    this.wm1 = registrationForm.getModalWindow1();
	    rootItem.add(this.wm1);
	    this.wm1.center();

	    this.wm2 = this.getModalWindow2();
	    rootItem.add(this.wm2);

	    /* Button 2 */
	    var button2 = this.__okButton =  new qx.ui.form.Button("Register!");
	    button2.addListener("execute", this.wm1.open, this.wm1); 
	    button2.setAllowStretchX(true); 
	    this.__box2.add(button2);

	    rootContainer.add(this.__box2); 
	    rootItem.add(rootContainer, {left: "50%", top: "30%"});	    
	},

	getModalWindow2 : function()
	{
	    var wm1 = new qx.ui.window.Window("Registration form");
	    wm1.setLayout(new qx.ui.layout.VBox());
	    wm1.setModal(true);
	    wm1.setAllowMinimize(false);
	    wm1.setAllowMaximize(false);
	    wm1.moveTo(250, 150);

	    var atom = new qx.ui.basic.Atom("Registration OK. Now log in!", "icon/32/apps/office-address-book.png");
	    atom.setRich(true);
	    wm1.add(atom);

	    var btn1 = new qx.ui.form.Button("OK");
	    btn1.addListener("execute", wm1.close, wm1);
	    wm1.add(btn1);

	    return wm1;
    	}

    }
});


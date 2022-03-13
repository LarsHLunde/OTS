var preLink = "APP_PREPEND_MARKER/secret/"

function tsToDate(ts) {
	var mytime = new Date(parseInt(ts));
	return mytime.toLocaleString("sv-SE")
}

function updateKeyTable() {
	var keytable = document.getElementById("keytable");

  $.get("ADMIN_PREPEND_MARKER/keys", function(data) {
		var keys = JSON.parse(data);
		var outString = "";
		var totalEntries = Object.keys(keys).length;
		var curLargest = 0;
		var curKey = "";
		for (let i = 0; i < totalEntries; i++) {
			Object.keys(keys).forEach(function(element) {
				var curInt = parseInt(keys[element])
				if (curInt > curLargest) {
					curLargest = curInt;
					curKey = element;
				}
			})
			outString += "<tr><td><a href=\"" + preLink + curKey.substring(7) + "\">" + preLink + curKey.substring(7) + "</a></td><td>" + tsToDate(keys[curKey]) + "</td></tr>"
			keys[curKey] = "0";
			curLargest = 0;
		}
		keytable.children[0].children[1].innerHTML = outString;
	})
}

function sendSecret(){
        var input = document.getElementById("input");
        message = {}
        message.value = input.value;
        var json_string = JSON.stringify(message);
        input.value = "";
        $.ajax({
                url: "ADMIN_PREPEND_MARKER/create",
                type: "POST",
                data: json_string,
                contentType: "application/json; charset=utf-8",
                dataType: "json"
        }).always(function(data){
					updateKeyTable();
				});
};

function setPassword(){
        var input = document.getElementById("password_input");
        message = {}
        message.value = input.value;
        var json_string = JSON.stringify(message);
        input.value = "";
        $.ajax({
                url: "ADMIN_PREPEND_MARKER/set_password",
                type: "POST",
                data: json_string,
                contentType: "application/json; charset=utf-8",
                dataType: "json"
        }).always(function(data){
					logout();
				});
};

function logout() {
  $.ajax({
      type: "GET",
      url: "ADMIN_PREPEND_MARKER/",
      async: true,
      username: "noone",
      password: "nopass",
  })
	.done(function(){
  console.log("Error in logout");
	})
	.fail(function(){
  	window.location = "ADMIN_PREPEND_MARKER/";
  });
}

function init() {
        updateKeyTable();
        setInterval(updateKeyTable, 5000);
};

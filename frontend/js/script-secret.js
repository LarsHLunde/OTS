function init() {
  var out = document.getElementById("output");
  out.innerHTML = "Getting secret...";

  $.get("APP_PREPEND_MARKER/api/secret/" + window.location.href.split("/").slice(-1), function(data) {
    var count = (data.match(/\n/g) || []).length;
    out.style.minHeight = toString(10+count*21) + "px"
    out.innerHTML = data.replaceAll("\n","<br />");
  })

};

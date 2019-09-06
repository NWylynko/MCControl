/* eslint-disable require-jsdoc */

// eslint-disable-next-line no-unused-vars
function save() {
  // function to save/update a file
  area = document.getElementById('ta');
  text = area.value;
  url = window.location.href.replace('edit', 'save');
  // simple way to get the url to send the post request to
  const xhr = new XMLHttpRequest();
  // library to send post requests
  xhr.onreadystatechange = function() {
    // we want the response to make sure it saves all good
    if (xhr.readyState == XMLHttpRequest.DONE) {
      text = document.getElementById('response');
      text.innerHTML = xhr.responseText;
      setTimeout(function() {
        text.innerHTML = '';
      }, 1500);
    }
  };
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({
    data: text,
  }));
}

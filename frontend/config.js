/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */

function save() {
  // function to save/update the config
  version = document.getElementById('select_version').value;
  password = document.getElementById('input_password').value;

  // url = window.location.href

  url = 'http://minecraft-gay.ddns.net/config';

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
    version,
    password,
  }));
}

function gotofiles() {
  window.location.href = window.location.href.replace('config', 'files/1.8.8/');
}

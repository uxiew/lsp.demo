const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
const showChat = document.querySelector('#showChat');
const backBtn = document.querySelector('.header__back');
myVideo.muted = true;

backBtn.addEventListener('click', () => {
  document.querySelector('.main__left').style.display = 'flex';
  document.querySelector('.main__left').style.flex = '1';
  document.querySelector('.main__right').style.display = 'none';
  document.querySelector('.header__back').style.display = 'none';
});

showChat.addEventListener('click', () => {
  document.querySelector('.main__right').style.display = 'flex';
  document.querySelector('.main__right').style.flex = '1';
  document.querySelector('.main__left').style.display = 'none';
  document.querySelector('.header__back').style.display = 'block';
});

const user = prompt('输入你的UserId：');

// in your client code
let myVideoStream;

const options = {
  serverUrl: `ws://110.42.220.32:9528/api/v1/im/message`,
  roomId: ROOM_ID,
  userId: user,
  debug: true
  // peerOptions: {
  //   iceServers: [
  //     {
  //       urls: 'turn:110.42.220.32:3478',
  //       username: 'admin',
  //       credential: '123456'
  //     }
  //   ]
  // }
};

let spw = new Lsp(options);

!(async function () {
  // Make the peer connection
  await spw.connect();

  spw.on('stream', videoStream => {
    console.log(videoStream);
    connectToNewUser(user, videoStream);
  });

  spw.on('message', ({ content }, userName = user) => {
    console.log('spw.on-message,', content, userName);
    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? 'me' : userName
        }</span> </b>
        <span>${content}</span>
    </div>`;
  });

  spw.join(ROOM_ID);
})();

spw.publishVideo('video-grid').then(async stream => {
  console.log('=======videovideo=====', stream);
});

let text = document.querySelector('#chat_message');
let send = document.getElementById('send');
let messages = document.querySelector('.messages');

send.addEventListener('click', e => {
  if (text.value.length !== 0) {
    spw.send({
      message: text.value
    });
    text.value = '';
  }
});

text.addEventListener('keydown', e => {
  if (e.key === 'Enter' && text.value.length !== 0) {
    spw.send({
      message: text.value
    });
    text.value = '';
  }
});

const inviteButton = document.querySelector('#inviteButton');
const muteButton = document.querySelector('#muteButton');
const stopVideo = document.querySelector('#stopVideo');
muteButton.addEventListener('click', () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle('background__red');
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle('background__red');
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener('click', () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle('background__red');
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle('background__red');
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener('click', e => {
  prompt(
    'Copy this link and send it to people you want to meet with',
    window.location.href
  );
});

// Close simple-peer connections before exiting
window.onbeforeunload = () => {
  spw.close();
};

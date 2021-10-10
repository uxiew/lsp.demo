function _createVideoEl(id) {
  const video = document.createElement('video');
  video.setAttribute('id', '_lspvideo' + Math.random());
  video.setAttribute('width', '100%');
  video.setAttribute('height', '100%');
  video.setAttribute('style', 'object-fit: cover');

  return document.getElementById(id).appendChild(video);
}

function play($video) {
  let video;
  try {
    video = typeof $video === 'string' ? _createVideoEl($video) : $video;

    video.srcObject = this;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
  } catch (error) {
    throw new Error(`play method need a video element's id or video Element!`);
  }
  return video;
}

function stop($video) {
  return video;
}

module.exports = { play };

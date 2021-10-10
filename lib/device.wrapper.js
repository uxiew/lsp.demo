const { BrowserDeviceManager } = require('browserdevicemanager');

const { play } = require('./helper');

const dcm = new BrowserDeviceManager();

console.log('devicemanager', dcm);

class DCM {
  async shareScreen(idOrVideo, screenConstraints) {
    if (!dcm.checkSupportScreenShare()) {
      throw new Error('Your browser does not support screen sharing!');
    }
    const screenStream = await dcm.getScreenTrack(screenConstraints);
    if (!idOrVideo) return screenStream;
    try {
      const videoEl =
        typeof idOrVideo === 'string'
          ? document.getElementById(idOrVideo)
          : idOrVideo;

      videoEl.srcObject = screenStream;
    } catch (error) {
      throw new Error(
        `shareScreen need a video element's id or video Element!`
      );
    }

    return screenStream;
  }

  async getCameraVideo(idOrVideo, constraints) {
    const cameraList = await dcm.getCameraList();
    const videotrack = await dcm.getVideoTrack({
      deviceId: cameraList && cameraList[0].deviceId,
      ...constraints
    });
    let videoStream = new MediaStream();
    videoStream.addTrack(videotrack);

    const streamData = {
      cameraList,
      videoStream,
      play: $video => play.call(videoStream, $video),
      stop: $video => stop.call(videoStream, $video)
    };

    if (idOrVideo) {
      play.call(videoStream, idOrVideo);
    }

    return streamData;
  }

  async getCameraAndMic() {
    const videoTrack = await this.getCameraVideo();
    const audioTrack = await dcm.getAudioTrack();

    let mediastream = new MediaStream();
    mediastream.addTrack(audioTrack);
    mediastream.addTrack(videoTrack);
    return mediastream;
  }

  async getCameraAndMic() {
    const list = await dcm.getCameraList();
    return list;
  }
}

module.exports = DCM;

let music = new Music()

function Music() {
  const audioBuffers = []
  let source = undefined
  let currentTrack = undefined
  const audioCount = 4 //repeat after this many tracks

  var context = new AudioContext();
  var gainNode = context.createGain();
  gainNode.connect(context.destination)
  gainNode.gain.setValueAtTime(0.2, context.currentTime)

  function loadAudio(tileSet) {
    if (audioBuffers[tileSet]===undefined) {
      console.log("music: loading " + tileSet)
      var request = new XMLHttpRequest()
      var url = (tileSet % audioCount) + '.ogg'
      //url = "test.wav"
      request.open('GET', url, true); 
      request.responseType = 'arraybuffer';
      request.onload = function() {
          context.decodeAudioData(request.response, function(response) {
            console.log("music: loaded " + tileSet)
            audioBuffers[tileSet] = response
            if (currentTrack == tileSet && source == undefined) {
              console.log("music: playing newly loaded track " + tileSet)
              playAudio()
            }
          }, function () { console.error('The request failed.') } )
      }
      request.send()
    }
  }

  function stopAudio() {
    if (source != undefined) {
      console.log("music: stopping")
      source.stop()
      source = undefined
    }
    currentTrack = undefined
  }

  function playAudio() {
    if (currentTrack==tileSet && source != undefined) return
    stopAudio()
    currentTrack = tileSet
    if (audioBuffers[tileSet]) {
      source = context.createBufferSource()
      source.connect(gainNode)
      source.buffer = audioBuffers[tileSet]
      source.start(context.currentTime)
      source.loop = true
      console.log("music: playing " + tileSet)
    } else {
      loadAudio(tileSet) //load (it will play automatically if it should)
      console.log("music: can't play " + tileSet + ", must load first")
    }
  }

  return {load: loadAudio, play: playAudio, stop:stopAudio}
}
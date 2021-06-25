const { ipcRenderer } = require("electron");
import React from 'react';
import {Howl, Howler} from 'howler';
import { xml2js, xml2json } from 'xml-js';

import useInterval from './hooks/useInterval';
import "./styles.scss"

const stations = {
  "kmhd": {
    name: "KMHD",
    stream: "https://ais-sa3.cdnstream1.com/2442_128.aac?listenerId=esAdblock0306361&aw_0_1st.playerid=esPlayer&aw_0_1st.skey=1624571649",
    nowPlaying: {
      url: "https://feed.tunein.com/profiles/s34028/nowPlaying?token=eyJwIjpmYWxzZSwidCI6IjIwMjEtMDYtMjRUMjI6Mjg6NTEuMjM3MjcwMloifQ&formats=mp3,aac,ogg,flash,html,hls&serial=6fcf2c78-e114-4d6e-b1dd-e89f50abac3e&partnerId=RadioTime&version=4.63&itemUrlScheme=secure&reqAttempt=1",
      type: "json",
      paths: ["Header.Subtitle"],
    },
  },
  "kisn": {
    name: "KISN Good Guy Radio",
    stream: "https://ice6.securenetsystems.net/KISNLP",
    nowPlaying: {
      url: `https://streamdb8web.securenetsystems.net/player_status_update/KISNLP.xml?randStr=${Math.random()}`,
      type: "xml",
      paths: ["playlist.artist._text", "playlist.title._text"],
    },
  },
  "xray": {
    name: "XRAY.FM",
    stream: "https://listen.xray.fm/stream",
    nowPlaying: {
      url: "https://xray.fm/api/broadcasting",
      type: "json",
      paths: ["now.title"],
    },
  },
  "kboo": {
    name: "KBOO",
    stream: "https://live.kboo.fm:8443/high",
    nowPlaying: {
      url: `https://kboo.fm/api/schedule/episode/one/at/${Math.floor(Date.now() / 1000)}`,
      type: "json",
      paths: ["0.title"],
    },
  },
  "outlaw": {
    name: "Outlaw.fm",
    stream: "https://usa17.fastcast4u.com/proxy/kievradio?mp=/1",
    nowPlaying: {
      url: "https://fastcast4u.com/player/kievradio/index.php?c=Outlaw%20Country%20128kb%20MP3&_=1624598403038",
      type: "json",
      paths: ["artist", "title"],
    },
  },
  "opb": {
    name: "OPB",
    stream: "https://ais-sa3.cdnstream1.com/2440_128.aac?listenerId=esAdblock0306361&aw_0_1st.playerid=esPlayer&aw_0_1st.skey=1624598603",
    nowPlaying: {
      url: "https://feed.tunein.com/profiles/s34542/nowPlaying?itemToken=BgUFAAEAAQABAAEAb28B7oYAAAEFAAA&formats=mp3,aac,ogg,flash,html,hls&serial=6fcf2c78-e114-4d6e-b1dd-e89f50abac3e&partnerId=RadioTime&version=4.63&itemUrlScheme=secure&reqAttempt=1",
      type: "json",
      paths: ["Header.Subtitle"],
    },
  },
  "kmhd2": {
    name: "KMHD2",
    // stream: "https://v7player.wostreaming.net/1181",
    // stream: "https://live.wostreaming.net/playlist/mhcc-kmhchd2aac-ibc1.m3u?source=v6player",
    stream: "https://live.wostreaming.net/direct/mhcc-kmhchd2aac-ibc1",
    nowPlaying: {
      url: "https://scraper2.onlineradiobox.com/us.kmhdhd2?l=0",
      type: "json",
      paths: ["title"],
    },
  },
  "chirp": {
    name: "CHIRP",
    stream: "https://peridot.streamguys1.com:5185/live",
    nowPlaying: {
      url: "https://storage.googleapis.com/chirpradio-public/playlist.json",
      type: "json",
      paths: ["now_playing.artist", "now_playing.track"],
    },
  },
  "kanw": {
    name: "KANW",
    // stream: "https://14923.live.streamtheworld.com/KANWFM.mp3?dist=triton-widget&tdsdk=js-2.9&pname=tdwidgets&pversion=2.9&banners=728x90&sbmid=923c1dd3-4c20-4c86-de63-664e8ce953cc",
    stream: "https://14923.live.streamtheworld.com/KANWFM.mp3",
    nowPlaying: {
      url: "https://api.composer.nprstations.org/v1/widget/53a977d2e1c84b54cdcb9d51/now?format=json&_=1624602631898",
      type: "json",
      paths: ["onNow.program.name"],
    },
  },
  "kexp": {
    name: "KEXP",
    stream: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
    nowPlaying: {
      url: "https://api.kexp.org/v2/plays/?format=json&limit=1&ordering=-airdate",
      type: "json",
      paths: ["results.0.artist", "results.0.song"],
    },
  },
}

const App = () => {
  const [currentStation, setCurrentStation] = React.useState(null)
  const [nowPlaying, setNowPlaying] = React.useState("-")
  const [stationImage, setStationImage] = React.useState(null)

  React.useEffect(() => {
    setupSounds();
  }, [])

  React.useEffect(() => {
    updateNowPlaying();

    ipcRenderer.on('media', (e, msg) => {
      if (msg === "playpause") {
        toggleCurrentStation();
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('media');
    }
  }, [currentStation])

  useInterval(() => {
    updateNowPlaying();
  }, 3000)

  function setupSounds() {
    for (const key in stations) {
      if (!stations[key].sound) {
        stations[key].sound = new Howl({
          src: stations[key].stream,
          html5: true,
          autoplay: false,
        });
      }
    }
  }

  async function updateNowPlaying() {
    if (!currentStation) return false

    function resolve(obj, path) {
      path = path.split('.');
      var current = obj;
      while (path.length) {
        if (typeof current !== 'object') return undefined;
        current = current[path.shift()];
      }
      return current;
    }

    async function prepare(req) {
      let results = "-"
      
      if (currentStation.nowPlaying.type === "json") {
        results = await req.json();
      }
      if (currentStation.nowPlaying.type === "xml") {
        const xml = await req.text();
        results = xml2js(xml, {compact: true});
      }

      return results
    }

    const req = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(currentStation.nowPlaying.url)}`);
    const results = await prepare(req);
    const parts = []
    currentStation.nowPlaying.paths.forEach(path => {
      parts.push(resolve(results, path));
    });

    setNowPlaying(`${parts.join(" - ")}`)
  }

  // async function updateStationImage() {
  //   const req = await fetch(stations.kmhd.nowPlaying);
  //   const results = await req.json();
  //   setStationImage(`${results.Primary.Image}`)
  // }

  function toggle(station) {
    stopAllStations();
    
    if (!currentStation || currentStation.stream !== station.stream) {
      setNowPlaying("-");
      setCurrentStation(station);
      station.sound.play();
    } else {
      setCurrentStation(null);
    }
  }

  function stopAllStations() {
    for (const key in stations) {
      stations[key].sound.stop();
    }
  }

  function toggleCurrentStation() {
    if (!currentStation) return false

    if (currentStation.sound.playing()) {
      currentStation.sound.stop();
    } else {
      currentStation.sound.play();
    }
  }

  return (
    <>
      <h2>{currentStation?.name}</h2>
      <h3>{nowPlaying}</h3>

      {Object.keys(stations).map((s, i) => {
        return <button key={i} onClick={() => toggle(stations[s])}>{stations[s].isPlaying ? "Stop" : "Play"} {s.toUpperCase()}</button>
      })}
    </>
  )
};

export default App;

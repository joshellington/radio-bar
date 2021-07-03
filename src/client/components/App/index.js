const { ipcRenderer, shell } = require("electron");
import React from 'react';
import {Howl, Howler} from 'howler';
import { xml2js, xml2json } from 'xml-js';
import { randomProperty, stringToHTML } from '../../utils';

import useInterval from './hooks/useInterval';
import "./styles.scss"

const proxy = `https://proxhole.herokuapp.com`

const stations = {
  "kmhd": {
    name: "KMHD",
    stream: "https://ais-sa3.cdnstream1.com/2442_128.aac?listenerId=esAdblock0306361&aw_0_1st.playerid=esPlayer&aw_0_1st.skey=1624571649",
    homepage: "https://kmhd.org/",
    nowPlaying: {
      url: "https://feed.tunein.com/profiles/s34028/nowPlaying?token=eyJwIjpmYWxzZSwidCI6IjIwMjEtMDYtMjRUMjI6Mjg6NTEuMjM3MjcwMloifQ&formats=mp3,aac,ogg,flash,html,hls&serial=6fcf2c78-e114-4d6e-b1dd-e89f50abac3e&partnerId=RadioTime&version=4.63&itemUrlScheme=secure&reqAttempt=1",
      type: "json",
      paths: ["Header.Subtitle"],
    },
  },
  "kisn": {
    name: "KISN Good Guy Radio",
    stream: "https://ice6.securenetsystems.net/KISNLP",
    homepage: "https://www.goodguyradio.com/",
    nowPlaying: {
      url: `https://streamdb8web.securenetsystems.net/player_status_update/KISNLP.xml?randStr=${Math.random()}`,
      type: "xml",
      paths: ["playlist.artist._text", "playlist.title._text"],
    },
  },
  "xray": {
    name: "XRAY.FM",
    stream: "https://listen.xray.fm/stream",
    homepage: "https://xray.fm/",
    nowPlaying: {
      url: "https://xray.fm/api/broadcasting",
      type: "json",
      paths: ["now.title"],
      proxy: true,
    },
  },
  "kboo": {
    name: "KBOO",
    stream: "https://live.kboo.fm:8443/high",
    homepage: "https://kboo.fm/",
    nowPlaying: {
      url: `https://kboo.fm/api/schedule/episode/one/at/${Math.floor(Date.now() / 1000)}`,
      type: "json",
      paths: ["0.title"],
      proxy: true,
    },
  },
  "outlaw": {
    name: "Outlaw.fm",
    stream: "https://usa17.fastcast4u.com/proxy/kievradio?mp=/1",
    homepage: "https://www.outlaw.fm/",
    nowPlaying: {
      url: "https://fastcast4u.com/player/kievradio/index.php?c=Outlaw%20Country%20128kb%20MP3&_=1624598403038",
      type: "json",
      paths: ["artist", "title"],
      proxy: true,
    },
  },
  "opb": {
    name: "OPB",
    stream: "https://ais-sa3.cdnstream1.com/2440_128.aac?listenerId=esAdblock0306361&aw_0_1st.playerid=esPlayer&aw_0_1st.skey=1624598603",
    homepage: "https://www.opb.org/",
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
    homepage: "http://kmhd2.org/",
    nowPlaying: {
      url: "https://scraper2.onlineradiobox.com/us.kmhdhd2?l=0",
      type: "json",
      paths: ["title"],
    },
  },
  "chirp": {
    name: "CHIRP",
    stream: "https://peridot.streamguys1.com:5185/live",
    homepage: "https://chirpradio.org/",
    nowPlaying: {
      url: "https://storage.googleapis.com/chirpradio-public/playlist.json",
      type: "json",
      paths: ["now_playing.artist", "now_playing.track"],
      proxy: true,
    },
  },
  "kanw": {
    name: "KANW",
    // stream: "https://14923.live.streamtheworld.com/KANWFM.mp3?dist=triton-widget&tdsdk=js-2.9&pname=tdwidgets&pversion=2.9&banners=728x90&sbmid=923c1dd3-4c20-4c86-de63-664e8ce953cc",
    stream: "https://14923.live.streamtheworld.com/KANWFM.mp3",
    homepage: "https://www.kanw.com/",
    nowPlaying: {
      url: "https://api.composer.nprstations.org/v1/widget/53a977d2e1c84b54cdcb9d51/now?format=json&_=1624602631898",
      type: "json",
      paths: ["onNow.program.name"],
    },
  },
  "kexp": {
    name: "KEXP",
    stream: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",
    homepage: "https://www.kexp.org/",
    nowPlaying: {
      url: "https://api.kexp.org/v2/plays/?format=json&limit=1&ordering=-airdate",
      type: "json",
      paths: ["results.0.artist", "results.0.song"],
    },
  },
  "wnrn": {
    name: "WNRN",
    stream: "https://22113.live.streamtheworld.com/WNRNFM_128.mp3",
    homepage: "https://www.wnrn.org/",
    nowPlaying: {
      url: "https://scraper2.onlineradiobox.com/us.w276bz",
      type: "json",
      paths: ["title"],
    },
  },
  "kxua": {
    name: "KXUA",
    stream: "http://kxua.uark.edu:8830/;",
    homepage: "http://kxua.uark.edu/",
    nowPlaying: {
      url: "https://feed.tunein.com/profiles/s26583/nowPlaying",
      type: "json",
      paths: ["Header.Subtitle"],
      proxy: true,
    },
  },
  "wxyc": {
    name: "WXYC",
    stream: "https://audio-mp3.ibiblio.org/wxyc.mp3",
    homepage: "https://wxyc.org/",
    nowPlaying: null,
  },
  "wyms": {
    name: "WYMS",
    stream: "https://wyms.streamguys1.com/live?platform=88nine",
    homepage: "https://radiomilwaukee.org/",
    nowPlaying: {
      url: "https://scraper2.onlineradiobox.com/us.wyms",
      type: "json",
      paths: ["title"],
    },
  },
  "waps": {
    name: "The Summit",
    stream: "https://securestreams2.autopo.st:1194/wapshq",
    homepage: "https://thesummit.fm/",
    nowPlaying: {
      url: "https://thesummit.fm/audio/hd1/hd1_play.php",
      type: "html",
      paths: null,
      selector: ["body"],
      proxy: true,
    },
  },
  "vmfm": {
    name: "VMFM",
    stream: "https://wvmw.streamguys1.com/live",
    homepage: "http://vmfm917.org/",
    nowPlaying: {
      url: "https://feed.tunein.com/profiles/s23570/nowPlaying",
      type: "json",
      paths: ["Header.Subtitle"],
      proxy: true,
    },
  },
  "wort": {
    name: "WORT",
    stream: "https://wortcast01.wortfm.org:8443/high.mp3",
    homepage: "https://www.wortfm.org/",
    nowPlaying: {
      url: "https://scraper2.onlineradiobox.com/us.wort?l=0",
      type: "json",
      paths: ["title"],
    },
  },
}

const App = () => {
  const [currentStation, setCurrentStation] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [nowPlaying, setNowPlaying] = React.useState("")
  const [stationImage, setStationImage] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setupSounds();

    document.body.addEventListener('click', event => {
      if (event.target.tagName.toLowerCase() === 'a' && event.target.protocol != 'file:') {
        event.preventDefault();
        shell.openExternal(event.target.href);
      }
    });
  }, [])

  React.useEffect(() => {
    updateNowPlaying();

    ipcRenderer.on('media', (e, msg) => {
      console.log(msg)
      if (msg === "playpause") {
        toggleCurrentStation();
      }

      if (msg === "next") {
        const newStation = randomProperty(stations);
        // console.log(newStation);
        toggle(newStation);
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('media');
    }
  }, [currentStation])

  useInterval(() => {
    updateNowPlaying();
  }, 5000);

  useInterval(() => {
    const height = document.querySelector('main').clientHeight + 12;
    ipcRenderer.send('resize', height);
  }, 100);

  function setupSounds() {
    for (const key in stations) {
      if (!stations[key].sound) {
        stations[key].sound = new Howl({
          src: stations[key].stream,
          html5: true,
          autoplay: false,
          onplay: () => {
            setIsPlaying(key);
            setIsLoading(false);
          },
        });
      }
    }
  }

  async function updateNowPlaying() {
    if (!currentStation || !currentStation.nowPlaying) return false

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
      let results = "-";
      
      if (currentStation.nowPlaying.type === "json") {
        results = await req.json();
      }
      if (currentStation.nowPlaying.type === "xml") {
        const xml = await req.text();
        results = xml2js(xml, {compact: true});
      }
      if (currentStation.nowPlaying.type === "html") {
        const htmlString = await req.text();
        const domEle = stringToHTML(htmlString);
        results = domEle.querySelector(currentStation.nowPlaying.selector).innerText.trim();
      }

      return results
    }

    let url = currentStation.nowPlaying.url;
    if (currentStation.nowPlaying.proxy) {
      url = `${proxy}/${currentStation.nowPlaying.url}`
    }
    const req = await fetch(url);
    const results = await prepare(req);

    if (currentStation.nowPlaying.paths) {
      const parts = []
      currentStation.nowPlaying.paths.forEach(path => {
        parts.push(resolve(results, path));
      });

      setNowPlaying(`${parts.join(" - ")}`);
    } else {
      setNowPlaying(results);
    }
    
  }

  // async function updateStationImage() {
  //   const req = await fetch(stations.kmhd.nowPlaying);
  //   const results = await req.json();
  //   setStationImage(`${results.Primary.Image}`)
  // }

  function toggle(station) {
    stopAllStations();
    
    if (!currentStation || currentStation.stream !== station.stream) {
      setIsLoading(true);
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
    setCurrentStation(null);
    setIsPlaying(false);
    setIsLoading(false);
  }

  function toggleCurrentStation() {
    if (!currentStation) return false

    if (currentStation.sound.playing()) {
      currentStation.sound.stop();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      currentStation.sound.play();
    }
  }

  return (
    <main>
      {isLoading && (
        <div className="loading">
          <p>Loading: {currentStation?.name}</p>
          <button onClick={() => stopAllStations()}>Cancel</button>
        </div>
      )}

      {currentStation && (
        <div className="now-playing">
          <h2><a href={currentStation.homepage} target="_blank">{currentStation?.name}</a></h2>
          <h3>{nowPlaying}</h3>
        </div>
      )}

      <div className="stations">
        {Object.keys(stations).map((s, i) => {
          return <button key={i} onClick={() => toggle(stations[s])} className={isPlaying === s ? `active` : ``}>{s.toUpperCase()}</button>
        })}
      </div>

      {currentStation && (
        <div className="controls">
          <button onClick={() => toggleCurrentStation()}>{isPlaying ? "Stop" : "Play"}</button>
        </div>
      )}
    </main>
  )
};

export default App;

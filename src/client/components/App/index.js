const { ipcRenderer, shell } = require('electron')
import React from 'react'
import { Howl, Howler } from 'howler'
import { xml2js, xml2json } from 'xml-js'
import Airtable from 'airtable'
import { randomProperty, stringToHTML } from '../../utils'

import useInterval from './hooks/useInterval'
import './styles.scss'

const proxy = `https://proxhole.herokuapp.com`

Airtable.configure({ apiKey: 'keyc7A763SxiuvCLu' })
const airtableDb = Airtable.base('appnU2lNzTVBE6dgV')

const App = () => {
  const [stations, setStations] = React.useState({})
  const [currentStation, setCurrentStation] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [nowPlaying, setNowPlaying] = React.useState('')
  // const [stationImage, setStationImage] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    document.body.addEventListener('click', (event) => {
      if (
        event.target.tagName.toLowerCase() === 'a' &&
        event.target.protocol != 'file:'
      ) {
        event.preventDefault()
        shell.openExternal(event.target.href)
      }
    })

    getStations()
  }, [])

  async function getStations() {
    const records = await airtableDb('table')
      .select({
        sort: [{ field: 'key', direction: 'asc' }],
      })
      .firstPage()
    const stationsObj = {}

    console.log(records)
    records.forEach((station, ind) => {
      stationsObj[station.fields.key] = {
        name: station.fields.name,
        homepage: station.fields.homepage,
        stream: station.fields.stream,
        nowPlaying: {
          url: station.fields['nowPlaying.url'],
          type: station.fields['nowPlaying.type'],
          paths: station.fields['nowPlaying.paths']?.split(', '),
          selector: station.fields['nowPlaying.selector'],
          proxy: station.fields['nowPlaying.proxy'] ? true : false,
        },
      }
    })

    setStations(stationsObj)
  }

  React.useEffect(() => {
    setupSounds()
  }, [stations])

  React.useEffect(() => {
    updateNowPlaying()

    ipcRenderer.on('media', (e, msg) => {
      console.log(msg)
      if (msg === 'playpause') {
        toggleCurrentStation()
      }

      if (msg === 'next') {
        const newStation = randomProperty(stations)
        toggle(newStation)
      }
    })

    return () => {
      ipcRenderer.removeAllListeners('media')
    }
  }, [currentStation])

  useInterval(() => {
    updateNowPlaying()
  }, 5000)

  useInterval(() => {
    const height = document.querySelector('main').clientHeight + 12
    ipcRenderer.send('resize', height)
  }, 100)

  function setupSounds() {
    for (const key in stations) {
      if (!stations[key].sound) {
        stations[key].sound = new Howl({
          src: stations[key].stream,
          html5: true,
          autoplay: false,
          onplay: () => {
            setIsPlaying(key)
            setIsLoading(false)
          },
        })
      }
    }
  }

  async function updateNowPlaying() {
    if (!currentStation || !currentStation.nowPlaying) return false

    function resolve(obj, path) {
      path = path.split('.')
      var current = obj
      while (path.length) {
        if (typeof current !== 'object') return undefined
        current = current[path.shift()]
      }
      return current
    }

    async function prepare(req) {
      let results = '-'

      if (currentStation.nowPlaying.type === 'json') {
        results = await req.json()
      }
      if (currentStation.nowPlaying.type === 'xml') {
        const xml = await req.text()
        results = xml2js(xml, { compact: true })
      }
      if (currentStation.nowPlaying.type === 'html') {
        const htmlString = await req.text()
        const domEle = stringToHTML(htmlString)
        results = domEle
          .querySelector(currentStation.nowPlaying.selector)
          .innerText.trim()
      }

      return results
    }

    let url = currentStation.nowPlaying.url
    if (currentStation.nowPlaying.proxy) {
      url = `${proxy}/${currentStation.nowPlaying.url}`
    }
    const req = await fetch(url)
    const results = await prepare(req)

    if (currentStation.nowPlaying.paths) {
      const parts = []
      currentStation.nowPlaying.paths.forEach((path) => {
        parts.push(resolve(results, path))
      })

      setNowPlaying(`${parts.join(' - ')}`)
    } else {
      setNowPlaying(results)
    }
  }

  // async function updateStationImage() {
  //   const req = await fetch(stations.kmhd.nowPlaying);
  //   const results = await req.json();
  //   setStationImage(`${results.Primary.Image}`)
  // }

  function toggle(station) {
    stopAllStations()

    if (!currentStation || currentStation.stream !== station.stream) {
      setIsLoading(true)
      setNowPlaying('-')
      setCurrentStation(station)
      station.sound.play()
    } else {
      setCurrentStation(null)
    }
  }

  function stopAllStations() {
    for (const key in stations) {
      stations[key].sound.stop()
    }
    setCurrentStation(null)
    setIsPlaying(false)
    setIsLoading(false)
  }

  function toggleCurrentStation() {
    if (!currentStation) return false

    if (currentStation.sound.playing()) {
      currentStation.sound.stop()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      currentStation.sound.play()
    }
  }

  function quitApp() {
    ipcRenderer.send('app-quit')
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
          <h2>
            <a href={currentStation.homepage} target="_blank">
              {currentStation?.name}
            </a>
          </h2>
          <h3>{nowPlaying}</h3>
        </div>
      )}

      <div className="stations">
        {Object.keys(stations).map((s, i) => {
          return (
            <button
              key={i}
              onClick={() => toggle(stations[s])}
              className={isPlaying === s ? `active` : ``}
            >
              {s.toUpperCase()}
            </button>
          )
        })}
      </div>

      {currentStation && (
        <div className="controls">
          <button onClick={() => toggleCurrentStation()}>
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <button className="quit-app" onClick={() => quitApp()}>
            Quit
          </button>
        </div>
      )}
    </main>
  )
}

export default App

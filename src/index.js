'use strict';
const debounce = require('p-debounce')
const {memoize} = require('cerebro-tools')
const {compareTwoStrings} = require('string-similarity')
const icon = require('../icon.png')
const keyword = 'hex'
const endpoint = 'https://hex.pm/api/packages/'
const TAB_KEY = 9
const memoizationSettings = {
  maxAge: 60 * 1000 // 1 minute
}

const map = f => xs => xs.map(f)

const sort = f => xs => xs.sort(f)

const fetchAll = debounce(memoize(
  name =>
    fetch(`${endpoint}?search=${encodeURIComponent(name)}`)
      .then(response => response.json())
, memoizationSettings), 300)

const packageToResult = actions => ({name, meta}) => {
  const url = `https://hex.pm/packages/${name}`

  return {
    icon,
    id: `hex-${name}`,
    title: name,
    subtitle: meta.description,
    clipboard: url,
    onSelect() {
      actions.open(url)
    },
    onKeyDown(event) {
      if (event.keyCode === TAB_KEY) {
        actions.replaceTerm(url)
      }
    }
  }
}

const sortBestMatch = name => (a, b) => {
  const [matchA, matchB] = [
    compareTwoStrings(name, a.name),
    compareTwoStrings(name, b.name)
  ]

  return matchB - matchA
}

const plugin = ({term, display, update, actions}) => {
  const rgx = /^hex\s+(.*)/

  if (!rgx.test(term)) return

  const [, name] = rgx.exec(term)

  fetchAll(name)
    .then(sort(sortBestMatch(name)))
    .then(map(packageToResult(actions)))
    .then(display)
};

module.exports = {
  keyword,
  fn: plugin
}

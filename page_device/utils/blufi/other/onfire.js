const onfireEvents = {}
let eventCounter = 0

function each(obj, callback) {
  Object.keys(obj).forEach((key) => callback(key, obj[key]))
}

function bind(eventName, callback, isOne, context) {
  if (typeof eventName !== 'string' || typeof callback !== 'function') {
    throw new Error('args: string, function')
  }
  if (!onfireEvents[eventName]) {
    onfireEvents[eventName] = {}
  }
  onfireEvents[eventName][++eventCounter] = [callback, isOne, context]
  return [eventName, eventCounter]
}

function on(eventName, callback, context) {
  return bind(eventName, callback, 0, context)
}

function one(eventName, callback, context) {
  return bind(eventName, callback, 1, context)
}

function fireInternal(eventName, args) {
  if (!onfireEvents[eventName]) return
  each(onfireEvents[eventName], function (key, item) {
    item[0].apply(item[2], args)
    if (item[1]) delete onfireEvents[eventName][key]
  })
}

function fire(eventName, ...args) {
  setTimeout(function () {
    fireInternal(eventName, args)
  })
}

function fireSync(eventName, ...args) {
  fireInternal(eventName, args)
}

function un(event) {
  if (typeof event === 'string') {
    if (onfireEvents[event]) {
      delete onfireEvents[event]
      return true
    }
    return false
  }
  if (typeof event === 'object') {
    const eventName = event[0]
    const key = event[1]
    if (onfireEvents[eventName] && onfireEvents[eventName][key]) {
      delete onfireEvents[eventName][key]
      return true
    }
    return false
  }
  if (typeof event === 'function') {
    let removed = false
    each(onfireEvents, function (eventName, items) {
      each(items, function (key, item) {
        if (item[0] === event) {
          delete onfireEvents[eventName][key]
          removed = true
        }
      })
    })
    return removed
  }
  return true
}

function clear() {
  Object.keys(onfireEvents).forEach((key) => delete onfireEvents[key])
}

const onfire = { on, one, un, fire, fireSync, clear }

export { on, one, un, fire, fireSync, clear }
export default onfire

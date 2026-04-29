import generatePrime from './lib/generatePrime.js'
import DH from './lib/dh.js'
import * as safeBufferModule from './lib/safe-buffer.js'

const Buffer = (safeBufferModule.default || safeBufferModule).Buffer

function getDiffieHellman(mod) {
  var prime = new Buffer(primes[mod].prime, 'hex')
  var gen = new Buffer(primes[mod].gen, 'hex')

  return new DH(prime, gen)
}

var ENCODINGS = {
  'binary': true, 'hex': true, 'base64': true
}

function createDiffieHellman(prime, enc, generator, genc) {
  if (Buffer.isBuffer(enc) || ENCODINGS[enc] === undefined) {
    return createDiffieHellman(prime, 'binary', enc, generator)
  }

  enc = enc || 'binary'
  genc = genc || 'binary'
  generator = generator || new Buffer([2])

  if (!Buffer.isBuffer(generator)) {
    generator = new Buffer(generator, genc)
  }

  if (typeof prime === 'number') {
    return new DH(generatePrime(prime, generator), generator, true)
  }

  if (!Buffer.isBuffer(prime)) {
    prime = new Buffer(prime, enc)
  }

  return new DH(prime, generator, true)
}

const DiffieHellmanGroup = getDiffieHellman
const createDiffieHellmanGroup = getDiffieHellman
const DiffieHellman = createDiffieHellman

export {
  DiffieHellmanGroup,
  createDiffieHellmanGroup,
  getDiffieHellman,
  createDiffieHellman,
  DiffieHellman
}

export default {
  DiffieHellmanGroup,
  createDiffieHellmanGroup,
  getDiffieHellman,
  createDiffieHellman,
  DiffieHellman
}

/* eslint no-unused-expressions:0 */
'use strict'

var Hapi = require('hapi')
var sinon = require('sinon')
var sandbox = sinon.sandbox.create()
var expect = require('chai')
  .use(require('chai-as-promised'))
  .use(require('sinon-chai'))
  .expect
var Tapestry = require('tapestry')
var _ = require('lodash')

// where is out plugin?
var pluginLocation = '../lib/pluginTapestry'
var pluginName = 'plugin-tapestry'
var server

// allow resources to be required safely
function loadTestResource (resource) {
  return _.cloneDeep(require(resource))
}

describe('pluginTapestry', function () {
  afterEach(function () {
    sandbox.restore()
  })

  before(async function () {
    // stub out some of the calls the plugin makes
    server = new Hapi.Server()
    // the plugin expects a few functions to return stuff to register properly
    // simulate that here so we don't try and talk to them
    server.methods.getService = sinon.stub().returns({
      sources: [{}]
    })
    server.methods.getDataLoggingWrapper = sinon.stub().returns(null)
    server.methods.getConfig = sinon.stub().returns({
      cache: false
    }) // not testing the cache either
    await server.register(require(pluginLocation))
  })

  describe('#register', function () {
    it('should allow us to access the plugin off the hapi server', function (done) {
      expect(server.plugins[pluginName]).to.not.be.undefined
      done()
    })
  })

  describe('#makeItSo', function () {
    describe('check the function is created', function () {
      it('should expose makeItSo as a function on the plugin', function (done) {
        expect(server.plugins[pluginName].makeItSo).to.be.a('function')
        done()
      })
    })

    describe('end to end to check we fail with a thrown error when options arent valid', function () {
      it('should reject the promise because of invalid options', function () {
        return expect(server.plugins[pluginName].makeItSo()).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })

      it('should reject the promise because of invalid options.ids', function () {
        return expect(server.plugins[pluginName].makeItSo(loadTestResource('./fixtures/invalidOptionsInputData'))).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })

      it('should reject the promise because of invalid options.identifier', function () {
        return expect(server.plugins[pluginName].makeItSo(loadTestResource('./fixtures/invalidOptionsIdentifier'))).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })
    })

    describe('end to end to check no code matches is handled correctly', function () {
      it('should return empty array when no results came back', function () {
        var expected = []
        return expect(server.plugins[pluginName].makeItSo(loadTestResource('./fixtures/noCode'))).to.become(expected)
      })
    })

    describe('end to end to check the result gets handled correctly from the call to tapestry.get', function () {
      beforeEach(function () {
        sandbox.stub(Tapestry.prototype, 'get').yields(null, loadTestResource('./fixtures/ABC123Content'))
        sandbox.stub(_, 'pick')
      })

      it('should return an array of objects from the ids passed in', function () {
        var expected = loadTestResource('./expected/ABC234Result')
        var result = server.plugins[pluginName].makeItSo(loadTestResource('./fixtures/ABC123Key'))
        return expect(result).to.become(expected)
      })
    })

    describe('with extra params', function () {
      var options = {
        ids: 'IDS',
        identifier: 'IDENT',
        lang: 'LANG',
        version: 'VERSION',
        extra: 'UNWANTED'
      }
      beforeEach(function () {
        sandbox.stub(Tapestry.prototype, 'get')
        sandbox.spy(_, 'pick')
        server.plugins[pluginName].makeItSo(options)
      })

      it('should pick the correct params', function () {
        expect(_.pick).to.have.been.calledWith(options, ['brand', 'identifier', 'ids', 'lang', 'version', 'eventCode'])
      })

      it('should pass only certain params on to tapestry', function () {
        var cleanOptions = {
          ids: 'IDS',
          identifier: 'IDENT',
          lang: 'LANG',
          version: 'VERSION'
        }
        expect(Tapestry.prototype.get).to.have.been.calledWith(cleanOptions)
      })
    })
  })

  describe('#makeItSoComplex', function () {
    describe('check the function is created', function () {
      it('should expose makeItSoComplex as a function on the plugin', function (done) {
        expect(server.plugins[pluginName].makeItSoComplex).to.be.a('function')
        done()
      })
    })

    describe('end to end to check we fail with a thrown error when options arent valid', function () {
      it('should reject the promise because of invalid options', function () {
        return expect(server.plugins[pluginName].makeItSoComplex()).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })

      it('should reject the promise because of invalid options.inputData', function () {
        return expect(server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/invalidOptionsInputData'))).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })

      it('should reject the promise because of invalid options.identifier', function () {
        return expect(server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/invalidOptionsIdentifier'))).to.eventually.be.rejected.and.eventually.have.property('error').that.is.an.instanceof(Error)
      })
    })

    describe('end to end to check no code matches is handled correctly', function () {
      it('should resolve with an empty object', function () {
        var expected = loadTestResource('./expected/noResult')
        return expect(server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/noCode'))).to.eventually.be.fulfilled.and.eventually.deep.equal(expected)
      })
    })

    describe('end to end to check the correct arguments reach the call to tapestry.get', function () {
      before(function () {
        // spy on the arguments that get to the tapestry.get call
        sandbox.spy(Tapestry.prototype, 'get')
      })

      it('should assign the fixture to the requested input `code`', function () {
        var expected = loadTestResource('./expected/ABC123Arguments')
        return server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/ABC123Key')).then(function () {
          expect(Tapestry.prototype.get.getCall(0).args[0]).to.deep.equal(expected)
        })
      })
    })

    describe('end to end to check the result gets handled correctly from the call to tapestry.get', function () {
      before(function () {
        sandbox.stub(Tapestry.prototype, 'get').yields(null, loadTestResource('./fixtures/ABC123Content'))
      })

      it('should bind the expected content to the requested fixture input `code`', function () {
        var expected = loadTestResource('./expected/ABC123Result')
        return expect(server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/ABC123Key'))).to.eventually.be.fulfilled.and.eventually.deep.equal(expected)
      })
    })

    describe('end to end to check the result gets handled correctly from the call to tapestry.get when no content is found', function () {
      before(function () {
        sandbox.stub(Tapestry.prototype, 'get').yields(null, loadTestResource('./fixtures/noResult'))
      })

      it('should not add a `code` property', function () {
        var expected = loadTestResource('./expected/ABC123NoResult')
        return expect(server.plugins[pluginName].makeItSoComplex(loadTestResource('./fixtures/ABC123Key'))).to.eventually.be.fulfilled.and.eventually.deep.equal(expected)
      })
    })
  })
})

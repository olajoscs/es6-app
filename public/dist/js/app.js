(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
;(function(undefined) {
    'use strict';
    /**
     * BottleJS v1.6.2 - 2017-11-27
     * A powerful dependency injection micro container
     *
     * Copyright (c) 2017 Stephen Young
     * Licensed MIT
     */
    
    /**
     * Unique id counter;
     *
     * @type Number
     */
    var id = 0;
    
    /**
     * Local slice alias
     *
     * @type Functions
     */
    var slice = Array.prototype.slice;
    
    /**
     * Iterator used to walk down a nested object.
     *
     * If Bottle.config.strict is true, this method will throw an exception if it encounters an
     * undefined path
     *
     * @param Object obj
     * @param String prop
     * @return mixed
     * @throws Error if Bottle is unable to resolve the requested service.
     */
    var getNested = function getNested(obj, prop) {
        var service = obj[prop];
        if (service === undefined && globalConfig.strict) {
            throw new Error('Bottle was unable to resolve a service.  `' + prop + '` is undefined.');
        }
        return service;
    };
    
    /**
     * Get a nested bottle. Will set and return if not set.
     *
     * @param String name
     * @return Bottle
     */
    var getNestedBottle = function getNestedBottle(name) {
        var bottle;
        if (!this.nested[name]) {
            bottle = Bottle.pop();
            this.nested[name] = bottle;
            this.factory(name, function SubProviderFactory() {
                return bottle.container;
            });
        }
        return this.nested[name];
    };
    
    /**
     * Get a service stored under a nested key
     *
     * @param String fullname
     * @return Service
     */
    var getNestedService = function getNestedService(fullname) {
        return fullname.split('.').reduce(getNested, this);
    };
    
    /**
     * Register a constant
     *
     * @param String name
     * @param mixed value
     * @return Bottle
     */
    var constant = function constant(name, value) {
        var parts = name.split('.');
        name = parts.pop();
        defineConstant.call(parts.reduce(setValueObject, this.container), name, value);
        return this;
    };
    
    var defineConstant = function defineConstant(name, value) {
        Object.defineProperty(this, name, {
            configurable : false,
            enumerable : true,
            value : value,
            writable : false
        });
    };
    
    /**
     * Register decorator.
     *
     * @param String fullname
     * @param Function func
     * @return Bottle
     */
    var decorator = function decorator(fullname, func) {
        var parts, name;
        if (typeof fullname === 'function') {
            func = fullname;
            fullname = '__global__';
        }
    
        parts = fullname.split('.');
        name = parts.shift();
        if (parts.length) {
            getNestedBottle.call(this, name).decorator(parts.join('.'), func);
        } else {
            if (!this.decorators[name]) {
                this.decorators[name] = [];
            }
            this.decorators[name].push(func);
        }
        return this;
    };
    
    /**
     * Register a function that will be executed when Bottle#resolve is called.
     *
     * @param Function func
     * @return Bottle
     */
    var defer = function defer(func) {
        this.deferred.push(func);
        return this;
    };
    
    
    /**
     * Immediately instantiates the provided list of services and returns them.
     *
     * @param Array services
     * @return Array Array of instances (in the order they were provided)
     */
    var digest = function digest(services) {
        return (services || []).map(getNestedService, this.container);
    };
    
    /**
     * Register a factory inside a generic provider.
     *
     * @param String name
     * @param Function Factory
     * @return Bottle
     */
    var factory = function factory(name, Factory) {
        return provider.call(this, name, function GenericProvider() {
            this.$get = Factory;
        });
    };
    
    /**
     * Register an instance factory inside a generic factory.
     *
     * @param {String} name - The name of the service
     * @param {Function} Factory - The factory function, matches the signature required for the
     * `factory` method
     * @return Bottle
     */
    var instanceFactory = function instanceFactory(name, Factory) {
        return factory.call(this, name, function GenericInstanceFactory(container) {
            return {
                instance : Factory.bind(Factory, container)
            };
        });
    };
    
    /**
     * A filter function for removing bottle container methods and providers from a list of keys
     */
    var byMethod = function byMethod(name) {
        return !/^\$(?:decorator|register|list)$|Provider$/.test(name);
    };
    
    /**
     * List the services registered on the container.
     *
     * @param Object container
     * @return Array
     */
    var list = function list(container) {
        return Object.keys(container || this.container || {}).filter(byMethod);
    };
    
    /**
     * Function used by provider to set up middleware for each request.
     *
     * @param Number id
     * @param String name
     * @param Object instance
     * @param Object container
     * @return void
     */
    var applyMiddleware = function applyMiddleware(middleware, name, instance, container) {
        var descriptor = {
            configurable : true,
            enumerable : true
        };
        if (middleware.length) {
            descriptor.get = function getWithMiddlewear() {
                var index = 0;
                var next = function nextMiddleware(err) {
                    if (err) {
                        throw err;
                    }
                    if (middleware[index]) {
                        middleware[index++](instance, next);
                    }
                };
                next();
                return instance;
            };
        } else {
            descriptor.value = instance;
            descriptor.writable = true;
        }
    
        Object.defineProperty(container, name, descriptor);
    
        return container[name];
    };
    
    /**
     * Register middleware.
     *
     * @param String name
     * @param Function func
     * @return Bottle
     */
    var middleware = function middleware(fullname, func) {
        var parts, name;
        if (typeof fullname === 'function') {
            func = fullname;
            fullname = '__global__';
        }
    
        parts = fullname.split('.');
        name = parts.shift();
        if (parts.length) {
            getNestedBottle.call(this, name).middleware(parts.join('.'), func);
        } else {
            if (!this.middlewares[name]) {
                this.middlewares[name] = [];
            }
            this.middlewares[name].push(func);
        }
        return this;
    };
    
    /**
     * Named bottle instances
     *
     * @type Object
     */
    var bottles = {};
    
    /**
     * Get an instance of bottle.
     *
     * If a name is provided the instance will be stored in a local hash.  Calling Bottle.pop multiple
     * times with the same name will return the same instance.
     *
     * @param String name
     * @return Bottle
     */
    var pop = function pop(name) {
        var instance;
        if (typeof name === 'string') {
            instance = bottles[name];
            if (!instance) {
                bottles[name] = instance = new Bottle();
                instance.constant('BOTTLE_NAME', name);
            }
            return instance;
        }
        return new Bottle();
    };
    
    /**
     * Clear all named bottles.
     */
    var clear = function clear(name) {
        if (typeof name === 'string') {
            delete bottles[name];
        } else {
            bottles = {};
        }
    };
    
    /**
     * Used to process decorators in the provider
     *
     * @param Object instance
     * @param Function func
     * @return Mixed
     */
    var reducer = function reducer(instance, func) {
        return func(instance);
    };
    
    /**
     * Register a provider.
     *
     * @param String fullname
     * @param Function Provider
     * @return Bottle
     */
    var provider = function provider(fullname, Provider) {
        var parts, name;
        parts = fullname.split('.');
        if (this.providerMap[fullname] && parts.length === 1 && !this.container[fullname + 'Provider']) {
            return console.error(fullname + ' provider already instantiated.');
        }
        this.originalProviders[fullname] = Provider;
        this.providerMap[fullname] = true;
    
        name = parts.shift();
    
        if (parts.length) {
            getNestedBottle.call(this, name).provider(parts.join('.'), Provider);
            return this;
        }
        return createProvider.call(this, name, Provider);
    };
    
    /**
     * Get decorators and middleware including globals
     *
     * @return array
     */
    var getWithGlobal = function getWithGlobal(collection, name) {
        return (collection[name] || []).concat(collection.__global__ || []);
    };
    
    /**
     * Create the provider properties on the container
     *
     * @param String name
     * @param Function Provider
     * @return Bottle
     */
    var createProvider = function createProvider(name, Provider) {
        var providerName, properties, container, id, decorators, middlewares;
    
        id = this.id;
        container = this.container;
        decorators = this.decorators;
        middlewares = this.middlewares;
        providerName = name + 'Provider';
    
        properties = Object.create(null);
        properties[providerName] = {
            configurable : true,
            enumerable : true,
            get : function getProvider() {
                var instance = new Provider();
                delete container[providerName];
                container[providerName] = instance;
                return instance;
            }
        };
    
        properties[name] = {
            configurable : true,
            enumerable : true,
            get : function getService() {
                var provider = container[providerName];
                var instance;
                if (provider) {
                    // filter through decorators
                    instance = getWithGlobal(decorators, name).reduce(reducer, provider.$get(container));
    
                    delete container[providerName];
                    delete container[name];
                }
                return instance === undefined ? instance : applyMiddleware(getWithGlobal(middlewares, name),
                    name, instance, container);
            }
        };
    
        Object.defineProperties(container, properties);
        return this;
    };
    
    /**
     * Register a service, factory, provider, or value based on properties on the object.
     *
     * properties:
     *  * Obj.$name   String required ex: `'Thing'`
     *  * Obj.$type   String optional 'service', 'factory', 'provider', 'value'.  Default: 'service'
     *  * Obj.$inject Mixed  optional only useful with $type 'service' name or array of names
     *  * Obj.$value  Mixed  optional Normally Obj is registered on the container.  However, if this
     *                       property is included, it's value will be registered on the container
     *                       instead of the object itsself.  Useful for registering objects on the
     *                       bottle container without modifying those objects with bottle specific keys.
     *
     * @param Function Obj
     * @return Bottle
     */
    var register = function register(Obj) {
        var value = Obj.$value === undefined ? Obj : Obj.$value;
        return this[Obj.$type || 'service'].apply(this, [Obj.$name, value].concat(Obj.$inject || []));
    };
    
    /**
     * Deletes providers from the map and container.
     *
     * @param String name
     * @return void
     */
    var removeProviderMap = function resetProvider(name) {
        delete this.providerMap[name];
        delete this.container[name];
        delete this.container[name + 'Provider'];
    };
    
    /**
     * Resets all providers on a bottle instance.
     *
     * @return void
     */
    var resetProviders = function resetProviders() {
        var providers = this.originalProviders;
        Object.keys(this.originalProviders).forEach(function resetPrvider(provider) {
            var parts = provider.split('.');
            if (parts.length > 1) {
                removeProviderMap.call(this, parts[0]);
                parts.forEach(removeProviderMap, getNestedBottle.call(this, parts[0]));
            }
            removeProviderMap.call(this, provider);
            this.provider(provider, providers[provider]);
        }, this);
    };
    
    
    /**
     * Execute any deferred functions
     *
     * @param Mixed data
     * @return Bottle
     */
    var resolve = function resolve(data) {
        this.deferred.forEach(function deferredIterator(func) {
            func(data);
        });
    
        return this;
    };
    
    /**
     * Register a service inside a generic factory.
     *
     * @param String name
     * @param Function Service
     * @return Bottle
     */
    var service = function service(name, Service) {
        var deps = arguments.length > 2 ? slice.call(arguments, 2) : null;
        var bottle = this;
        return factory.call(this, name, function GenericFactory() {
            var ServiceCopy = Service;
            if (deps) {
                var args = deps.map(getNestedService, bottle.container);
                args.unshift(Service);
                ServiceCopy = Service.bind.apply(Service, args);
            }
            return new ServiceCopy();
        });
    };
    
    /**
     * Register a value
     *
     * @param String name
     * @param mixed val
     * @return Bottle
     */
    var value = function value(name, val) {
        var parts;
        parts = name.split('.');
        name = parts.pop();
        defineValue.call(parts.reduce(setValueObject, this.container), name, val);
        return this;
    };
    
    /**
     * Iterator for setting a plain object literal via defineValue
     *
     * @param Object container
     * @param string name
     */
    var setValueObject = function setValueObject(container, name) {
        var nestedContainer = container[name];
        if (!nestedContainer) {
            nestedContainer = {};
            defineValue.call(container, name, nestedContainer);
        }
        return nestedContainer;
    };
    
    /**
     * Define a mutable property on the container.
     *
     * @param String name
     * @param mixed val
     * @return void
     * @scope container
     */
    var defineValue = function defineValue(name, val) {
        Object.defineProperty(this, name, {
            configurable : true,
            enumerable : true,
            value : val,
            writable : true
        });
    };
    
    
    /**
     * Bottle constructor
     *
     * @param String name Optional name for functional construction
     */
    var Bottle = function Bottle(name) {
        if (!(this instanceof Bottle)) {
            return Bottle.pop(name);
        }
    
        this.id = id++;
    
        this.decorators = {};
        this.middlewares = {};
        this.nested = {};
        this.providerMap = {};
        this.originalProviders = {};
        this.deferred = [];
        this.container = {
            $decorator : decorator.bind(this),
            $register : register.bind(this),
            $list : list.bind(this)
        };
    };
    
    /**
     * Bottle prototype
     */
    Bottle.prototype = {
        constant : constant,
        decorator : decorator,
        defer : defer,
        digest : digest,
        factory : factory,
        instanceFactory: instanceFactory,
        list : list,
        middleware : middleware,
        provider : provider,
        resetProviders : resetProviders,
        register : register,
        resolve : resolve,
        service : service,
        value : value
    };
    
    /**
     * Bottle static
     */
    Bottle.pop = pop;
    Bottle.clear = clear;
    Bottle.list = list;
    
    /**
     * Global config
     */
    var globalConfig = Bottle.config = {
        strict : false
    };
    
    /**
     * Exports script adapted from lodash v2.4.1 Modern Build
     *
     * @see http://lodash.com/
     */
    
    /**
     * Valid object type map
     *
     * @type Object
     */
    var objectTypes = {
        'function' : true,
        'object' : true
    };
    
    (function exportBottle(root) {
    
        /**
         * Free variable exports
         *
         * @type Function
         */
        var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
    
        /**
         * Free variable module
         *
         * @type Object
         */
        var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
    
        /**
         * CommonJS module.exports
         *
         * @type Function
         */
        var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
    
        /**
         * Free variable `global`
         *
         * @type Object
         */
        var freeGlobal = objectTypes[typeof global] && global;
        if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
            root = freeGlobal;
        }
    
        /**
         * Export
         */
        if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
            root.Bottle = Bottle;
            define(function() { return Bottle; });
        } else if (freeExports && freeModule) {
            if (moduleExports) {
                (freeModule.exports = Bottle).Bottle = Bottle;
            } else {
                freeExports.Bottle = Bottle;
            }
        } else {
            root.Bottle = Bottle;
        }
    }((objectTypes[typeof window] && window) || this));
    
}.call(this));
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bottlejs = require('bottlejs');

var _bottlejs2 = _interopRequireDefault(_bottlejs);

var _config = require('../config/config.js');

var _config2 = _interopRequireDefault(_config);

var _DataProvider = require('../js/services/DataProvider');

var _DataProvider2 = _interopRequireDefault(_DataProvider);

var _ProductRepository = require('../js/services/ProductRepository');

var _ProductRepository2 = _interopRequireDefault(_ProductRepository);

var _CategoryRepostiory = require('../js/services/CategoryRepostiory');

var _CategoryRepostiory2 = _interopRequireDefault(_CategoryRepostiory);

var _ProductListController = require('../js/controllers/ProductListController');

var _ProductListController2 = _interopRequireDefault(_ProductListController);

var _CategoryController = require('../js/controllers/CategoryController');

var _CategoryController2 = _interopRequireDefault(_CategoryController);

var _MainpageController = require('../js/controllers/MainpageController');

var _MainpageController2 = _interopRequireDefault(_MainpageController);

var _ProductController = require('../js/controllers/ProductController');

var _ProductController2 = _interopRequireDefault(_ProductController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bottle = new _bottlejs2.default();

bottle.factory('dataProvider', function (bottle) {
    return new _DataProvider2.default(_config2.default);
});

bottle.service('categoryRepository', _CategoryRepostiory2.default, 'dataProvider');
bottle.service('productRepository', _ProductRepository2.default, 'categoryRepository', 'dataProvider');

bottle.service('productController', _ProductController2.default, 'productRepository');
bottle.service('productListController', _ProductListController2.default, 'productRepository');
bottle.service('categoryController', _CategoryController2.default, 'categoryRepository');
bottle.service('mainpageController', _MainpageController2.default, 'categoryRepository');

exports.default = bottle.container;

},{"../config/config.js":4,"../js/controllers/CategoryController":7,"../js/controllers/MainpageController":8,"../js/controllers/ProductController":9,"../js/controllers/ProductListController":10,"../js/services/CategoryRepostiory":12,"../js/services/DataProvider":13,"../js/services/ProductRepository":14,"bottlejs":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Router = require('../js/models/Router');

var _Router2 = _interopRequireDefault(_Router);

var _dependencies = require('./dependencies');

var _dependencies2 = _interopRequireDefault(_dependencies);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Router2.default.add('product-list', function () {
    _dependencies2.default.productListController.getList();
});

_Router2.default.add('category-list', function () {
    _dependencies2.default.categoryController.getList();
});

_Router2.default.add('category\/(.*)', function (categoryUrl) {
    _dependencies2.default.productListController.getProductList(categoryUrl);
});

_Router2.default.add('product\/(.*)', function (productUrl) {
    _dependencies2.default.productController.getProduct(productUrl);
});

_Router2.default.add('', function () {
    _dependencies2.default.mainpageController.index();
});

exports.default = _Router2.default;

},{"../js/models/Router":11,"./dependencies":2}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Config for the DataProvider
 */
var config = {
  /**
   * Host of the backend
   */
  HOST: 'http://ts_backend.test',

  /**
   * Additional url after the host (folder, etc)
   */
  URL: ''
};

exports.default = config;

},{}],5:[function(require,module,exports){
'use strict';

var _routes = require('../bootstrap/routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_routes2.default.navigate('/' + _routes2.default.getFragment());
_routes2.default.listen();

},{"../bootstrap/routes":3}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Basic actions for rendering the content
 */
var BaseController = function () {
    function BaseController() {
        _classCallCheck(this, BaseController);

        this.content = document.querySelector('#content');
        this.clearContent();
        this.addLinkEvents();
    }

    /**
     * Fix the links to have hash in the url and onclick events
     */


    _createClass(BaseController, [{
        key: 'addLinkEvents',
        value: function addLinkEvents() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = document.getElementsByTagName('a')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var link = _step.value;

                    var oldUrl = link.getAttribute('href');
                    var hashPos = oldUrl.indexOf('#');

                    if (hashPos === -1) {
                        link.href = '#' + oldUrl;
                    }

                    // link.addEventListener('click', (event) => {
                    //     event.preventDefault();
                    //     router.navigate(link.getAttribute('href'));
                    //     return false;
                    // });
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        /**
         * Clears the content
         */

    }, {
        key: 'clearContent',
        value: function clearContent() {
            this.content.innerHTML = '';
        }
    }]);

    return BaseController;
}();

exports.default = BaseController;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BaseController2 = require('./BaseController');

var _BaseController3 = _interopRequireDefault(_BaseController2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Controller of category-related actions
 */
var CategoryController = function (_BaseController) {
    _inherits(CategoryController, _BaseController);

    function CategoryController(categoryRepository) {
        _classCallCheck(this, CategoryController);

        var _this = _possibleConstructorReturn(this, (CategoryController.__proto__ || Object.getPrototypeOf(CategoryController)).call(this));

        _this.categoryRepository = categoryRepository;
        return _this;
    }

    /**
     * Display all categories
     */


    _createClass(CategoryController, [{
        key: 'getList',
        value: function getList() {
            var _this2 = this;

            this.clearContent();
            this.categoryRepository.getList(function (response) {
                var templateDiv = document.querySelector('#category-template');

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = response.result[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var category = _step.value;

                        var clone = templateDiv.cloneNode(true);
                        var categoryDiv = _this2.fillCategory(clone, category);

                        _this2.content.appendChild(categoryDiv);
                        _this2.addLinkEvents();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });
        }

        /**
         * Fill and return a clone of the category-template div with the category data
         *
         * @param div
         * @param category
         *
         * @returns {*}
         */

    }, {
        key: 'fillCategory',
        value: function fillCategory(div, category) {
            var link = document.createElement('a');
            var linkText = document.createTextNode(category.name);

            link.appendChild(linkText);
            link.title = category.name;
            link.href = '/category/' + category.url;

            div.querySelector('.category-title').appendChild(link);

            div.classList.remove('hidden');

            return div;
        }
    }]);

    return CategoryController;
}(_BaseController3.default);

exports.default = CategoryController;

},{"./BaseController":6}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BaseController2 = require('./BaseController');

var _BaseController3 = _interopRequireDefault(_BaseController2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MainpageController = function (_BaseController) {
    _inherits(MainpageController, _BaseController);

    function MainpageController(categoryRepository) {
        _classCallCheck(this, MainpageController);

        var _this = _possibleConstructorReturn(this, (MainpageController.__proto__ || Object.getPrototypeOf(MainpageController)).call(this));

        _this.categoryRepository = categoryRepository;
        return _this;
    }

    _createClass(MainpageController, [{
        key: 'index',
        value: function index() {
            this.clearContent();

            this.categoryRepository.getList(function (response) {});
        }
    }]);

    return MainpageController;
}(_BaseController3.default);

exports.default = MainpageController;

},{"./BaseController":6}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BaseController2 = require('./BaseController');

var _BaseController3 = _interopRequireDefault(_BaseController2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Controller of product details related actions
 */
var ProductController = function (_BaseController) {
        _inherits(ProductController, _BaseController);

        function ProductController(productRepository) {
                _classCallCheck(this, ProductController);

                var _this = _possibleConstructorReturn(this, (ProductController.__proto__ || Object.getPrototypeOf(ProductController)).call(this));

                _this.productRepository = productRepository;
                return _this;
        }

        /**
         * Display a product by its url
         *
         * @param url
         */


        _createClass(ProductController, [{
                key: 'getProduct',
                value: function getProduct(url) {
                        var _this2 = this;

                        this.clearContent();

                        this.productRepository.getByUrl(url, function (response) {
                                var product = response.result;

                                _this2.fillProduct(product);

                                _this2.addLinkEvents();
                        });
                }

                /**
                 * Clone and fill the product details, then add it to the content
                 *
                 * @param product
                 */

        }, {
                key: 'fillProduct',
                value: function fillProduct(product) {
                        var templateDiv = document.querySelector('#product-details');

                        var div = templateDiv.cloneNode(true);

                        var link = document.createElement('a');
                        var linkText = document.createTextNode(product.name);
                        link.appendChild(linkText);
                        link.title = product.name;
                        link.href = '/product/' + product.url;

                        div.querySelector('.product-title').appendChild(link);
                        div.querySelector('.product-price').innerHTML = product.price;
                        div.querySelector('.product-description').innerHTML = product.description;

                        var categoryLink = document.createElement('a');
                        var categoryLinkText = document.createTextNode(product.category.name);
                        categoryLink.appendChild(categoryLinkText);
                        categoryLink.title = product.category.name;
                        categoryLink.href = '/category/' + product.category.url;

                        div.querySelector('.product-category').appendChild(categoryLink);

                        div.classList.remove('hidden');

                        this.content.appendChild(div);
                }
        }]);

        return ProductController;
}(_BaseController3.default);

exports.default = ProductController;

},{"./BaseController":6}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BaseController2 = require('./BaseController');

var _BaseController3 = _interopRequireDefault(_BaseController2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Controller of productlist-related actions
 */
var ProductListController = function (_BaseController) {
    _inherits(ProductListController, _BaseController);

    function ProductListController(productRepository) {
        _classCallCheck(this, ProductListController);

        var _this = _possibleConstructorReturn(this, (ProductListController.__proto__ || Object.getPrototypeOf(ProductListController)).call(this));

        _this.productRepository = productRepository;
        return _this;
    }

    /**
     * Display the list of all the products
     */


    _createClass(ProductListController, [{
        key: 'getList',
        value: function getList() {
            var _this2 = this;

            this.clearContent();

            this.productRepository.getList(function (response) {
                var products = response.result;

                _this2.fillProducts(products);
            });
        }

        /**
         * Display the list of all the products with the category
         *
         * @param categoryUrl
         */

    }, {
        key: 'getProductList',
        value: function getProductList(categoryUrl) {
            var _this3 = this;

            this.clearContent();

            this.productRepository.getListCategory(categoryUrl, function (response) {
                var products = response.result;

                _this3.fillProducts(products);
            });
        }

        /**
         * Append the product divs to the content
         *
         * @param products
         */

    }, {
        key: 'fillProducts',
        value: function fillProducts(products) {
            var templateDiv = document.querySelector('#product-template');

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = products[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var product = _step.value;

                    var clone = templateDiv.cloneNode(true);

                    var productDiv = this.fillProduct(clone, product);

                    this.content.appendChild(productDiv);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.addLinkEvents();
        }

        /**
         * Fill and return a clone of the product-template div with the product data
         *
         * @param div
         * @param product
         *
         * @returns {*}
         */

    }, {
        key: 'fillProduct',
        value: function fillProduct(div, product) {

            var link = document.createElement('a');
            var linkText = document.createTextNode(product.name);
            link.appendChild(linkText);
            link.title = product.name;
            link.href = '/product/' + product.url;

            div.querySelector('.product-title').appendChild(link);

            div.classList.remove('hidden');

            return div;
        }
    }]);

    return ProductListController;
}(_BaseController3.default);

exports.default = ProductListController;

},{"./BaseController":6}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Small router
 * Based on http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
 */
var Router = function () {
    function Router() {
        _classCallCheck(this, Router);

        this.routes = [];
    }

    _createClass(Router, [{
        key: 'add',
        value: function add(url, handler) {
            if (typeof url === 'function') {
                handler = url;
                url = '';
            }
            this.routes.push({ url: url, handler: handler });
            return this;
        }
    }, {
        key: 'remove',
        value: function remove(param) {
            for (var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
                if (r.handler === param || r.url.toString() === param.toString()) {
                    this.routes.splice(i, 1);
                    return this;
                }
            }
            return this;
        }
    }, {
        key: 'getFragment',
        value: function getFragment() {
            var match = window.location.href.match(/#(.*)$/);
            var fragment = match ? match[1] : '';

            return this.clearSlashes(fragment);
        }
    }, {
        key: 'check',
        value: function check(f) {
            var fragment = f || this.getFragment();
            for (var i = 0; i < this.routes.length; i++) {
                var match = fragment.match(this.routes[i].url);
                if (match) {
                    match.shift();
                    this.routes[i].handler.apply({}, match);
                    return this;
                }
            }
            return this;
        }
    }, {
        key: 'listen',
        value: function listen() {
            var _this = this;

            var current = this.getFragment();
            var isFirst = true;
            var fn = function fn() {
                if (current !== _this.getFragment() || isFirst) {
                    current = _this.getFragment();
                    _this.check(current);
                    isFirst = false;
                }
            };

            clearInterval(this.interval);
            this.interval = setInterval(fn, 50);
            return this;
        }
    }, {
        key: 'navigate',
        value: function navigate(path) {
            path = path ? path : '';

            if (path.indexOf('#') === -1) {
                path = '#' + path;
            }

            window.location.href = window.location.href.replace(/#(.*)$/, '') + path;

            return this;
        }
    }, {
        key: 'clearSlashes',
        value: function clearSlashes(path) {
            return path.toString().replace(/\/$/, '').replace(/^\//, '');
        }
    }]);

    return Router;
}();

var router = new Router();
exports.default = router;

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Repository object of the categories
 */
var CategoryRepostiory = function () {
    function CategoryRepostiory(dataProvider) {
        _classCallCheck(this, CategoryRepostiory);

        this.dataProvider = dataProvider;
    }

    /**
     * Return all the categories
     *
     * @returns Promise
     */


    _createClass(CategoryRepostiory, [{
        key: 'getList',
        value: function getList(cb) {
            return this.dataProvider.send({ type: 'category.list' }).then(cb);
        }
    }]);

    return CategoryRepostiory;
}();

exports.default = CategoryRepostiory;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Request sender against the API
 */
var DataProvider = function () {
    function DataProvider(config) {
        _classCallCheck(this, DataProvider);

        this.host = config.HOST;
        this.url = config.URL;
    }

    /**
     * Generate the full url, where the request should be sent
     *
     * @returns {*}
     */


    _createClass(DataProvider, [{
        key: 'generateUrl',
        value: function generateUrl() {
            var url = this.host;

            if (this.url !== '') {
                url = url + '/' + this.url;
            }

            return url;
        }

        /**
         * Send the request against the API
         *
         * @param parameters
         * @returns {Promise}
         */

    }, {
        key: 'send',
        value: function send() {
            var parameters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var url = '';
            var type = 'GET';
            var data = parameters.data || null;

            switch (parameters.type) {
                case 'product.list':
                    url = this.generateUrl() + '/products';
                    break;
                case 'category.list':
                    url = this.generateUrl() + '/categories';
                    break;
                case 'product.category.list':
                    var categoryUrl = parameters.category || '';
                    url = this.generateUrl() + '/categories/' + categoryUrl;
                    break;
                case 'product.details':
                    var productUrl = parameters.url || '';
                    url = this.generateUrl() + '/products/' + productUrl;
                    break;
                default:
                    throw 'Error: Invalid type: ' + parameters.type;

            }

            return this.sendRequest({
                url: url,
                method: type,
                data: data
            });
        }

        /**
         * Send the request against the API
         *
         * @param requestParameter
         * @returns {Promise}
         */

    }, {
        key: 'sendRequest',
        value: function sendRequest(requestParameter) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open(requestParameter.method, requestParameter.url);
                xhr.setRequestHeader('Content-Type', 'application-json');

                xhr.onload = function () {
                    var response = JSON.parse(xhr.response);

                    if (this.status >= 200 && this.status < 300) {
                        resolve(response);
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                };

                xhr.send();
            });
        }
    }]);

    return DataProvider;
}();

exports.default = DataProvider;

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Repository object of the products
 */
var ProductRepository = function () {
    function ProductRepository(categoryRepository, dataProvider) {
        _classCallCheck(this, ProductRepository);

        this.categoryRepository = categoryRepository;
        this.dataProvider = dataProvider;
    }

    /**
     * Return all the products
     *
     * @param cb Callback, after the promise
     *
     * @returns Promise
     */


    _createClass(ProductRepository, [{
        key: 'getList',
        value: function getList(cb) {
            return this.dataProvider.send({ type: 'product.list' }).then(cb);
        }

        /**
         * Return all the products for the category url
         *
         * @param categoryUrl Url of the category
         * @param cb Callback, after the promise
         *
         * @returns Promise
         */

    }, {
        key: 'getListCategory',
        value: function getListCategory(categoryUrl, cb) {
            return this.dataProvider.send({ type: 'product.category.list', category: categoryUrl }).then(cb);
        }

        /**
         * Return the product by its url
         *
         * @param url
         * @param cb
         *
         * @returns Promise
         */

    }, {
        key: 'getByUrl',
        value: function getByUrl(url, cb) {
            return this.dataProvider.send({ type: 'product.details', url: url }).then(cb);
        }
    }]);

    return ProductRepository;
}();

exports.default = ProductRepository;

},{}]},{},[5]);

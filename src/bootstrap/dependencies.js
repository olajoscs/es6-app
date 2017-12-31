import BottleJs from 'bottlejs';
import config from '../config/config.js';
import DataProvider from '../js/services/DataProvider';
import ProductRepository from '../js/services/ProductRepository';
import CategoryRepository from '../js/services/CategoryRepostiory';
import ProductListController from '../js/controllers/ProductListController';
import CategoryController from '../js/controllers/CategoryController';
import MainpageController from '../js/controllers/MainpageController';
import ProductController from '../js/controllers/ProductController';

let bottle = new BottleJs;

bottle.factory('dataProvider', function(bottle) {
    return new DataProvider(config);
});

bottle.service('categoryRepository', CategoryRepository, 'dataProvider');
bottle.service('productRepository', ProductRepository, 'categoryRepository', 'dataProvider');

bottle.service('productController', ProductController, 'productRepository');
bottle.service('productListController', ProductListController, 'productRepository');
bottle.service('categoryController', CategoryController, 'categoryRepository');
bottle.service('mainpageController', MainpageController, 'categoryRepository');

export default bottle.container;


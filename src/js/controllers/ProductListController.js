import BaseController from './BaseController';

/**
 * Controller of productlist-related actions
 */
export default class ProductListController extends BaseController {

    constructor(productRepository) {
        super();

        this.productRepository = productRepository;
    }


    /**
     * Display the list of all the products
     */
    getList() {
        this.clearContent();

        this.productRepository.getList((response) => {
            let products = response.result;

            this.fillProducts(products);
        });
    }


    /**
     * Display the list of all the products with the category
     *
     * @param categoryUrl
     */
    getProductList(categoryUrl) {
        this.clearContent();

        this.productRepository.getListCategory(categoryUrl, (response) => {
            let products = response.result;

            this.fillProducts(products);
        });
    }


    /**
     * Append the product divs to the content
     *
     * @param products
     */
    fillProducts(products) {
        const templateDiv = document.querySelector('#product-template');

        for (let product of products) {
            let clone = templateDiv.cloneNode(true);

            let productDiv = this.fillProduct(clone, product);

            this.content.appendChild(productDiv);
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
    fillProduct(div, product) {

        let link = document.createElement('a');
        let linkText = document.createTextNode(product.name);
        link.appendChild(linkText);
        link.title = product.name;
        link.href = '/product/' + product.url;

        div.querySelector('.product-title').appendChild(link);

        div.classList.remove('hidden');

        return div;
    }
}

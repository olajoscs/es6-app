import BaseController from './BaseController';

/**
 * Controller of product details related actions
 */
export default class ProductController extends BaseController {

    constructor(productRepository) {
        super();

        this.productRepository = productRepository;
    }


    /**
     * Display a product by its url
     *
     * @param url
     */
    getProduct(url) {
        this.clearContent();

        this.productRepository.getByUrl(url, (response) => {
            let product = response.result;

            this.fillProduct(product);

            this.addLinkEvents();
        });
    }


    /**
     * Clone and fill the product details, then add it to the content
     *
     * @param product
     */
    fillProduct(product) {
        const templateDiv = document.querySelector('#product-details');

        let div = templateDiv.cloneNode(true);

        let link = document.createElement('a');
        let linkText = document.createTextNode(product.name);
        link.appendChild(linkText);
        link.title = product.name;
        link.href = '/product/' + product.url;

        div.querySelector('.product-title').appendChild(link);
        div.querySelector('.product-price').innerHTML = product.price;
        div.querySelector('.product-description').innerHTML = product.description;

        let categoryLink = document.createElement('a');
        let categoryLinkText = document.createTextNode(product.category.name);
        categoryLink.appendChild(categoryLinkText);
        categoryLink.title = product.category.name;
        categoryLink.href = '/category/' + product.category.url;

        div.querySelector('.product-category').appendChild(categoryLink);

        div.classList.remove('hidden');

        this.content.appendChild(div);
    }

}

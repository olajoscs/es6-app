/**
 * Repository object of the products
 */
export default class ProductRepository {

    constructor(categoryRepository, dataProvider) {
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
    getList(cb) {
        return this.dataProvider.send({type: 'product.list'}).then(cb);
    }


    /**
     * Return all the products for the category url
     *
     * @param categoryUrl Url of the category
     * @param cb Callback, after the promise
     *
     * @returns Promise
     */
    getListCategory(categoryUrl, cb) {
        return this.dataProvider.send({type: 'product.category.list', category: categoryUrl}).then(cb);
    }


    /**
     * Return the product by its url
     *
     * @param url
     * @param cb
     *
     * @returns Promise
     */
    getByUrl(url, cb) {
        return this.dataProvider.send({type: 'product.details', url: url}).then(cb);
    }

}

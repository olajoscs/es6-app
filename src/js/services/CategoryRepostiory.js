/**
 * Repository object of the categories
 */
export default class CategoryRepostiory {

    constructor(dataProvider) {
        this.dataProvider = dataProvider;
    }


    /**
     * Return all the categories
     *
     * @returns Promise
     */
    getList(cb) {
        return this.dataProvider.send({type: 'category.list'}).then(cb);
    }
}

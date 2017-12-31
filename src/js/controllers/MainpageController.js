import BaseController from './BaseController';

export default class MainpageController extends BaseController {

    constructor(categoryRepository) {
        super();
        this.categoryRepository = categoryRepository;
    }


    index() {
        this.clearContent();

        this.categoryRepository.getList((response) => {

        });
    }
}

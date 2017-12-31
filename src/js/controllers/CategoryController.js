import BaseController from './BaseController';

/**
 * Controller of category-related actions
 */
export default class CategoryController extends BaseController {

    constructor(categoryRepository) {
        super();

        this.categoryRepository = categoryRepository;
    }


    /**
     * Display all categories
     */
    getList() {
        this.clearContent();
        this.categoryRepository.getList((response) => {
            const templateDiv = document.querySelector('#category-template');

            for (let category of response.result) {
                let clone = templateDiv.cloneNode(true);
                let categoryDiv = this.fillCategory(clone, category);

                this.content.appendChild(categoryDiv);
                this.addLinkEvents();
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
    fillCategory(div, category) {
        let link = document.createElement('a');
        let linkText = document.createTextNode(category.name);

        link.appendChild(linkText);
        link.title = category.name;
        link.href = '/category/' + category.url;

        div.querySelector('.category-title').appendChild(link);

        div.classList.remove('hidden');

        return div;
    }
}

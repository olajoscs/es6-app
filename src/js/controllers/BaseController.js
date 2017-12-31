/**
 * Basic actions for rendering the content
 */
export default class BaseController {

    constructor() {
        this.content = document.querySelector('#content');
        this.clearContent();
        this.addLinkEvents();
    }


    /**
     * Fix the links to have hash in the url and onclick events
     */
    addLinkEvents() {
        for (let link of document.getElementsByTagName('a')) {
            let oldUrl = link.getAttribute('href');
            let hashPos = oldUrl.indexOf('#');

            if (hashPos === -1) {
                link.href = '#' + oldUrl;
            }

            // link.addEventListener('click', (event) => {
            //     event.preventDefault();
            //     router.navigate(link.getAttribute('href'));
            //     return false;
            // });
        }
    }


    /**
     * Clears the content
     */
    clearContent() {
        this.content.innerHTML = '';
    }
}

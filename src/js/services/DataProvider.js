/**
 * Request sender against the API
 */
export default class DataProvider {

    constructor(config) {
        this.host = config.HOST;
        this.url = config.URL;
    }


    /**
     * Generate the full url, where the request should be sent
     *
     * @returns {*}
     */
    generateUrl() {
        let url = this.host;

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
    send(parameters = {}) {
        let url = '';
        let type = 'GET';
        let data = parameters.data || null;

        switch (parameters.type) {
            case 'product.list':
                url = this.generateUrl() + '/products';
                break;
            case 'category.list':
                url = this.generateUrl() + '/categories';
                break;
            case 'product.category.list':
                let categoryUrl = parameters.category || '';
                url = this.generateUrl() + '/categories/' + categoryUrl;
                break;
            case 'product.details':
                let productUrl = parameters.url || '';
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
    sendRequest(requestParameter) {
        return new Promise(function(resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(requestParameter.method, requestParameter.url);
            xhr.setRequestHeader('Content-Type', 'application-json');

            xhr.onload = function() {
                let response = JSON.parse(xhr.response);

                if (this.status >= 200 && this.status < 300) {
                    resolve(response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    })
                }
            };

            xhr.send();
        });
    }
}

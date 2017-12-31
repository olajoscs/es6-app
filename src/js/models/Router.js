/**
 * Small router
 * Based on http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
 */
class Router {

    constructor() {
        this.routes = [];
    }

    add(url, handler) {
        if (typeof url === 'function') {
            handler = url;
            url     = '';
        }
        this.routes.push({url: url, handler: handler});
        return this;
    }

    remove(param) {
        for (let i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
            if (r.handler === param || r.url.toString() === param.toString()) {
                this.routes.splice(i, 1);
                return this;
            }
        }
        return this;
    }

    getFragment() {
        let match = window.location.href.match(/#(.*)$/);
        let fragment  = match ? match[1] : '';

        return this.clearSlashes(fragment);
    }

    check(f) {
        let fragment = f || this.getFragment();
        for (let i = 0; i < this.routes.length; i++) {
            let match = fragment.match(this.routes[i].url);
            if (match) {
                match.shift();
                this.routes[i].handler.apply({}, match);
                return this;
            }
        }
        return this;
    }

    listen() {
        let current = this.getFragment();
        let isFirst = true;
        let fn      = () => {
            if (current !== this.getFragment() || isFirst) {
                current = this.getFragment();
                this.check(current);
                isFirst = false;
            }
        };

        clearInterval(this.interval);
        this.interval = setInterval(fn, 50);
        return this;
    }

    navigate(path) {
        path = path ? path : '';

        if (path.indexOf('#') === -1) {
            path = '#' + path;
        }

        window.location.href = window.location.href.replace(/#(.*)$/, '') + path;

        return this;
    }

    clearSlashes(path) {
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
    }
}

let router = new Router();
export default router;

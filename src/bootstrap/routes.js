import router from '../js/models/Router';
import container from './dependencies';

router.add('product-list', () => {
    container.productListController.getList();
});

router.add('category-list', () => {
    container.categoryController.getList();
});

router.add('category\/(.*)', (categoryUrl) => {
    container.productListController.getProductList(categoryUrl);
});

router.add('product\/(.*)', (productUrl) => {
    container.productController.getProduct(productUrl);
});

router.add('', () => {
    container.mainpageController.index();
});

export default router;

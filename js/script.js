document.addEventListener("DOMContentLoaded", async () => {
    const CART_KEY = "drewaneCart";
    const WISHLIST_KEY = "drewaneWishlist";
    const ACCOUNT_KEY = "drewaneAccount";
    const ORDERS_KEY = "drewaneOrders";
    const LAST_ORDER_KEY = "drewaneLastOrder";
    const SELECTED_PRODUCT_KEY = "drewaneSelectedProduct";

    let products = [];

    async function loadProducts() {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        const data = await response.json();

        products = data.map(product => ({
            id: `product-${String(product.id).padStart(2, "0")}`,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            category: product.category
        }));
    }

    function getStorage(key, fallback = []) {
        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function formatPrice(price) {
        return `$${Number(price).toLocaleString("en-US")}`;
    }

    function getImageName(src) {
        if (!src) return "";

        const cleanSrc = src.split("?")[0];
        return cleanSrc.substring(cleanSrc.lastIndexOf("/") + 1);
    }

    function findProduct(id) {
        return products.find(product => product.id === id);
    }

    async function loadCart() {
        const response = await fetch("/api/cart");

        if (!response.ok) {
            throw new Error("Unable to load cart.");
        }

        const data = await response.json();

        const cart = data.map(item => ({
            id: `product-${String(item.product_id).padStart(2, "0")}`,
            cartItemId: item.id,
            name: item.name,
            price: Number(item.price),
            image: item.image,
            quantity: Number(item.quantity),
            size: item.size || null
        }));

        setStorage(CART_KEY, cart);

        return cart;
    }

    async function clearCart() {
        const response = await fetch("/api/cart", {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Unable to clear cart.");
        }

        setStorage(CART_KEY, []);
    }

    function updateCartCount() {
        const cart = getStorage(CART_KEY, []);
        const count = cart.reduce((total, item) => {
            return total + Number(item.quantity || 0);
        }, 0);

        document.querySelectorAll(".cart-count").forEach(element => {
            element.textContent = `(${count})`;
        });
    }

    function getCardProduct(card) {
        if (!card) return null;

        const image = card.querySelector("img");
        const nameElement = card.querySelector(
            ".product-name, .card-name, h3, h2"
        );
        const priceElement = card.querySelector(
            ".product-price, .card-price, .price, .product-info p"
        );

        const imageName = getImageName(image?.getAttribute("src"));

        const matchedProduct = products.find(
            product => product.image === imageName
        );

        const name = nameElement?.textContent.trim() || matchedProduct?.name;

        const priceText = priceElement?.textContent || "";

        const price = Number(
            priceText.replace(/[^0-9.]/g, "")
        ) || matchedProduct?.price;

        if (!name || !price) {
            return matchedProduct || null;
        }

        return {
            id: matchedProduct?.id || imageName.replace(/\.[^/.]+$/, ""),
            name,
            price,
            image: imageName || matchedProduct?.image || "",
            category: matchedProduct?.category || ""
        };
    }

    function isInWishlist(productId) {
        const wishlist = getStorage(WISHLIST_KEY, []);

        return wishlist.some(
            item => item.id === productId
        );
    }

    function updateWishlistButtons() {
        document.querySelectorAll(
            ".wishlist-button, .product-wishlist, [data-wishlist]"
        ).forEach(button => {
            const card = button.closest(".product-card");

            let productId = button.dataset.productId;

            if (!productId && card) {
                const product = getCardProduct(card);

                if (product) {
                    productId = product.id;
                    button.dataset.productId = product.id;
                }
            }

            if (!productId) return;

            const active = isInWishlist(productId);

            button.classList.toggle("active", active);
            button.setAttribute(
                "aria-pressed",
                String(active)
            );

            if (
                button.textContent.trim() === "♡" ||
                button.textContent.trim() === "♥️"
            ) {
                button.textContent = active ? "♥️" : "♡";
            }
        });
    }

    function toggleWishlist(product) {
        if (!product) return;

        const wishlist = getStorage(WISHLIST_KEY, []);

        const existingIndex = wishlist.findIndex(
            item => item.id === product.id
        );

        if (existingIndex !== -1) {
            wishlist.splice(existingIndex, 1);
        } else {
            wishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category
            });
        }

        setStorage(WISHLIST_KEY, wishlist);

        updateWishlistButtons();

        if (document.querySelector("#wishlist-products")) {
            renderWishlist();
        }

        if (document.querySelector("#account-wishlist-preview")) {
            renderAccountWishlistPreview();
        }
    }

    function setupWishlistButtons() {
        document.querySelectorAll(
            ".wishlist-button, .product-wishlist, [data-wishlist]"
        ).forEach(button => {
            if (button.dataset.wishlistReady === "true") return;

            button.dataset.wishlistReady = "true";

            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();

                const card = button.closest(".product-card");

                let product = null;

                if (card) {
                    product = getCardProduct(card);
                }

                if (!product && button.dataset.productId) {
                    product = findProduct(button.dataset.productId);
                }

                if (!product) {
                    const productPage =
                        document.querySelector(".product-page");

                    if (productPage) {
                        const title =
                            productPage.querySelector(
                                ".product-title, h1"
                            )?.textContent.trim();

                        const priceText =
                            productPage.querySelector(
                                ".product-price, .price"
                            )?.textContent || "";

                        const image =
                            productPage.querySelector(
                                ".product-main-image img, .product-gallery img"
                            );

                        const matched = products.find(
                            item => item.name === title
                        );

                        if (matched) {
                            product = matched;
                        } else if (title) {
                            product = {
                                id: "product-01",
                                name: title,
                                price: Number(
                                    priceText.replace(
                                        /[^0-9.]/g,
                                        ""
                                    )
                                ) || 0,
                                image: getImageName(
                                    image?.getAttribute("src")
                                ),
                                category: ""
                            };
                        }
                    }
                }

                if (product) {
                    toggleWishlist(product);
                }
            });
        });

        updateWishlistButtons();
    }

    async function addToCart(product, quantity = 1, size = null) {
        if (!product) return;

        const productId = Number(
            String(product.id).replace("product-", "")
        );

        const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product_id: productId,
                quantity,
                size: size || null
            })
        });

        if (!response.ok) {
            throw new Error("Unable to add product to cart.");
        }

        await loadCart();
        updateCartCount();
    }

    function setupProductPage() {
        const productPage =
            document.querySelector(".product-page");

        if (!productPage) return;

        const titleElement =
            productPage.querySelector(".product-details h1");

        const priceElement =
            productPage.querySelector(".product-price");

        const categoryElement =
            productPage.querySelector(".product-details .section-label");

        const mainImage =
            productPage.querySelector(
                ".product-main-image img"
            );

        const thumbnailButtons =
            productPage.querySelectorAll(
                ".product-gallery-thumbs .product-thumb"
            );

        const sizeContainer =
            productPage.querySelector(
                ".product-option"
            );

        const selectedProduct =
            getStorage(
                SELECTED_PRODUCT_KEY,
                null
            );

        let currentProduct =
            selectedProduct &&
            selectedProduct.name
                ? products.find(
                    product =>
                        product.id === selectedProduct.id ||
                        product.name === selectedProduct.name
                ) || selectedProduct
                : products[0];

        if (
            currentProduct &&
            titleElement
        ) {
            titleElement.textContent =
                currentProduct.name;

            if (priceElement) {
                priceElement.textContent =
                    formatPrice(
                        currentProduct.price
                    );
            }

            if (categoryElement) {
                categoryElement.textContent =
                    `DREWANE / ${currentProduct.category.toUpperCase()}`;
            }

            if (
                mainImage &&
                currentProduct.image
            ) {
                mainImage.src =
                    `../assets/images/${currentProduct.image}`;

                mainImage.alt =
                    currentProduct.name;
            }

            const isRing =
                currentProduct.category === "rings";

            if (sizeContainer) {
                sizeContainer.hidden =
                    !isRing;
            }

            thumbnailButtons.forEach(
                (thumbnail, index) => {
                    const image =
                        thumbnail.querySelector("img");

                    if (!image) return;

                    if (index === 0) {
                        image.src =
                            `../assets/images/${currentProduct.image}`;

                        image.alt =
                            currentProduct.name;

                        thumbnail.classList.add(
                            "is-active"
                        );
                    } else {
                        thumbnail.hidden = true;
                    }
                }
            );
        }

        const sizeOptions =
            productPage.querySelectorAll(
                ".size-option"
            );

        let selectedSize = null;

        sizeOptions.forEach(option => {
            if (option.classList.contains("is-selected")) {
                selectedSize =
                    option.textContent.trim();

                option.setAttribute(
                    "aria-pressed",
                    "true"
                );
            } else {
                option.setAttribute(
                    "aria-pressed",
                    "false"
                );
            }

            option.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();

                sizeOptions.forEach(item => {
                    item.classList.remove(
                        "is-selected"
                    );

                    item.setAttribute(
                        "aria-pressed",
                        "false"
                    );
                });

                option.classList.add(
                    "is-selected"
                );

                option.setAttribute(
                    "aria-pressed",
                    "true"
                );

                selectedSize =
                    option.textContent.trim();
            });
        });

        let quantity = 1;

        const quantityDisplay =
            productPage.querySelector(
                ".quantity-control > span"
            );

        const decreaseButton =
            productPage.querySelector(
                '.quantity-control button[aria-label="Decrease quantity"]'
            );

        const increaseButton =
            productPage.querySelector(
                '.quantity-control button[aria-label="Increase quantity"]'
            );

        if (decreaseButton) {
            decreaseButton.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();

                quantity = Math.max(
                    1,
                    quantity - 1
                );

                if (quantityDisplay) {
                    quantityDisplay.textContent =
                        quantity;
                }
            });
        }

        if (increaseButton) {
            increaseButton.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();

                quantity += 1;

                if (quantityDisplay) {
                    quantityDisplay.textContent =
                        quantity;
                }
            });
        }

        const addButton =
            productPage.querySelector(
                ".add-to-bag-button"
            );

        if (addButton) {
            addButton.addEventListener(
                "click",
                async event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const title =
                        titleElement?.textContent.trim() ||
                        "Aurelia Ring";

                    const price =
                        Number(
                            priceElement?.textContent.replace(
                                /[^0-9.]/g,
                                ""
                            )
                        ) || 420;

                    const image =
                        getImageName(
                            mainImage?.getAttribute(
                                "src"
                            )
                        ) || "product-01.webp";

                    const matched =
                        products.find(
                            item =>
                                item.name ===
                                title
                        );

                    const product =
                        matched || {
                            id: "product-01",
                            name: title,
                            price,
                            image,
                            category: "rings"
                        };

                    try {
                        await addToCart(
                            product,
                            quantity,
                            product.category === "rings"
                                ? selectedSize
                                : null
                        );

                        const originalText =
                            addButton.textContent;

                        addButton.textContent =
                            "Added to Bag";

                        setTimeout(() => {
                            addButton.textContent =
                                originalText;
                        }, 1500);
                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        }

        setupProductGallery();
    }

    function setupProductGallery() {
        const mainImage =
            document.querySelector(
                ".product-main-image img"
            );

        const thumbnails =
            document.querySelectorAll(
                ".product-gallery-thumbs .product-thumb"
            );

        if (
            !mainImage ||
            !thumbnails.length
        ) {
            return;
        }

        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (thumbnail.hidden) return;

                    const image =
                        thumbnail.querySelector(
                            "img"
                        );

                    if (!image) return;

                    const source =
                        image.getAttribute(
                            "src"
                        );

                    if (!source) return;

                    mainImage.src =
                        source;

                    mainImage.alt =
                        image.getAttribute(
                            "alt"
                        ) || mainImage.alt;

                    thumbnails.forEach(
                        item => {
                            item.classList.remove(
                                "is-active"
                            );
                        }
                    );

                    thumbnail.classList.add(
                        "is-active"
                    );
                }
            );
        });
    }

    function setupHeroSlider() {
        const slides =
            document.querySelectorAll(
                ".hero-slide"
            );

        if (slides.length <= 1) return;

        let current =
            Array.from(slides).findIndex(
                slide =>
                    slide.classList.contains(
                        "is-active"
                    )
            );

        if (current === -1) {
            current = 0;

            slides[0].classList.add(
                "is-active"
            );
        }

        setInterval(() => {
            slides[current].classList.remove(
                "is-active"
            );

            current =
                (current + 1) %
                slides.length;

            slides[current].classList.add(
                "is-active"
            );
        }, 5000);
    }

    function setupProductSliders() {
        const sliders =
            document.querySelectorAll(
                ".product-slider"
            );

        sliders.forEach(slider => {
            const track =
                slider.querySelector(
                    ".product-track"
                );

            if (!track) return;

            const cards =
                track.querySelectorAll(
                    ".product-card"
                );

            if (cards.length <= 1) return;

            let current = 0;

            const moveSlider = () => {
                const firstCard =
                    cards[0];

                if (!firstCard) return;

                const cardWidth =
                    firstCard.getBoundingClientRect()
                        .width;

                const trackStyle =
                    window.getComputedStyle(
                        track
                    );

                const gap =
                    parseFloat(
                        trackStyle.columnGap ||
                        trackStyle.gap ||
                        "0"
                    ) || 0;

                const step =
                    cardWidth + gap;

                if (window.innerWidth <= 768) {
                    const maxScroll =
                        slider.scrollWidth -
                        slider.clientWidth;

                    if (maxScroll <= 0) {
                        return;
                    }

                    current += 1;

                    if (
                        current * step >
                        maxScroll
                    ) {
                        current = 0;

                        slider.scrollTo({
                            left: 0,
                            behavior: "smooth"
                        });

                        return;
                    }

                    slider.scrollTo({
                        left:
                            current * step,
                        behavior: "smooth"
                    });

                    return;
                }

                const visibleCards =
                    Math.max(
                        1,
                        Math.floor(
                            slider.clientWidth /
                            step
                        )
                    );

                const maxPosition =
                    Math.max(
                        0,
                        cards.length -
                        visibleCards
                    );

                if (maxPosition <= 0) {
                    return;
                }

                current += 1;

                if (
                    current >
                    maxPosition
                ) {
                    current = 0;
                }

                track.style.transition =
                    "transform 0.7s ease";

                track.style.transform =
                    `translateX(-${current * step}px)`;
            };

            setInterval(
                moveSlider,
                5000
            );
        });
    }

    async function renderCart() {
        const container =
            document.querySelector(
                "#cart-products"
            );

        const emptyState =
            document.querySelector(
                "#cart-empty"
            );

        if (!container) return;

        let cart;

        try {
            cart = await loadCart();
        } catch (error) {
            console.error(error);

            cart = getStorage(
                CART_KEY,
                []
            );
        }

        container.innerHTML = "";

        if (!cart.length) {
            if (emptyState) {
                emptyState.hidden = false;
            }

            updateCartTotals(0);
            updateCartCount();

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        cart.forEach(
            (item, index) => {
                const article =
                    document.createElement(
                        "article"
                    );

                article.className =
                    "cart-product";

                article.innerHTML = `
                    <div class="cart-product-image">
                        <img
                            src="../assets/images/${item.image}"
                            alt="${item.name}"
                        >
                    </div>

                    <div class="cart-product-info">
                        <h3>${item.name}</h3>
                        <p>${formatPrice(item.price)}</p>
                        ${
                            item.size
                                ? `<p>Size: ${item.size}</p>`
                                : ""
                        }

                        <div class="cart-product-controls">
                            <button
                                type="button"
                                data-cart-decrease="${index}"
                                aria-label="Decrease quantity"
                            >−</button>

                            <span>${item.quantity}</span>

                            <button
                                type="button"
                                data-cart-increase="${index}"
                                aria-label="Increase quantity"
                            >+</button>

                            <button
                                type="button"
                                data-cart-remove="${index}"
                            >Remove</button>
                        </div>
                    </div>
                `;

                container.appendChild(
                    article
                );
            }
        );

        updateCartTotals();
        updateCartCount();
        setupCartControls();
    }

    function setupCartControls() {
        document.querySelectorAll(
            "[data-cart-decrease]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    const index =
                        Number(
                            button.dataset
                                .cartDecrease
                        );

                    const cart =
                        getStorage(
                            CART_KEY,
                            []
                        );

                    if (!cart[index]) return;

                    const newQuantity =
                        Number(
                            cart[index].quantity
                        ) - 1;

                    try {
                        if (
                            newQuantity <= 0
                        ) {
                            const response =
                                await fetch(
                                    `/api/cart/${cart[index].cartItemId}`,
                                    {
                                        method: "DELETE"
                                    }
                                );

                            if (!response.ok) {
                                throw new Error(
                                    "Unable to remove cart item."
                                );
                            }
                        } else {
                            const response =
                                await fetch(
                                    `/api/cart/${cart[index].cartItemId}`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },
                                        body:
                                            JSON.stringify({
                                                quantity:
                                                    newQuantity
                                            })
                                    }
                                );

                            if (!response.ok) {
                                throw new Error(
                                    "Unable to update cart quantity."
                                );
                            }
                        }

                        await renderCart();
                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        });

        document.querySelectorAll(
            "[data-cart-increase]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    const index =
                        Number(
                            button.dataset
                                .cartIncrease
                        );

                    const cart =
                        getStorage(
                            CART_KEY,
                            []
                        );

                    if (!cart[index]) return;

                    const newQuantity =
                        Number(
                            cart[index].quantity
                        ) + 1;

                    try {
                        const response =
                            await fetch(
                                `/api/cart/${cart[index].cartItemId}`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body:
                                        JSON.stringify({
                                            quantity:
                                                newQuantity
                                        })
                                    }
                                );

                        if (!response.ok) {
                            throw new Error(
                                "Unable to update cart quantity."
                            );
                        }

                        await renderCart();
                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        });

        document.querySelectorAll(
            "[data-cart-remove]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    const index =
                        Number(
                            button.dataset
                                .cartRemove
                        );

                    const cart =
                        getStorage(
                            CART_KEY,
                            []
                        );

                    if (!cart[index]) return;

                    try {
                        const response =
                            await fetch(
                                `/api/cart/${cart[index].cartItemId}`,
                                {
                                    method: "DELETE"
                                }
                            );

                        if (!response.ok) {
                            throw new Error(
                                "Unable to remove cart item."
                            );
                        }

                        await renderCart();
                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        });
    }

    function updateCartTotals(
        subtotalOverride = null
    ) {
        const cart =
            getStorage(
                CART_KEY,
                []
            );

        const subtotal =
            subtotalOverride !== null
                ? subtotalOverride
                : cart.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.price
                        ) *
                        Number(
                            item.quantity
                        ),
                    0
                );

        const subtotalElement =
            document.querySelector(
                "#cart-subtotal"
            );

        const totalElement =
            document.querySelector(
                "#cart-total"
            );

        if (subtotalElement) {
            subtotalElement.textContent =
                formatPrice(
                    subtotal
                );
        }

        if (totalElement) {
            totalElement.textContent =
                formatPrice(
                    subtotal
                );
        }
    }

    function renderWishlist() {
        const container =
            document.querySelector(
                "#wishlist-products"
            );

        const emptyState =
            document.querySelector(
                "#wishlist-empty"
            );

        if (!container) return;

        const wishlist =
            getStorage(
                WISHLIST_KEY,
                []
            );

        container.innerHTML = "";

        if (!wishlist.length) {
            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        wishlist.forEach(item => {
            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "product-card";

            article.innerHTML = `
                <a
                    href="product.html"
                    data-product-link="${item.id}"
                >
                    <div class="product-image">
                        <img
                            src="../assets/images/${item.image}"
                            alt="${item.name}"
                        >
                    </div>

                    <div class="product-card-info">
                        <h3 class="product-name">
                            ${item.name}
                        </h3>

                        <p class="product-price">
                            ${formatPrice(item.price)}
                        </p>
                    </div>
                </a>

                <button
                    type="button"
                    class="wishlist-button active"
                    data-product-id="${item.id}"
                    aria-label="Remove ${item.name} from wishlist"
                    aria-pressed="true"
                >♥️</button>
            `;

            container.appendChild(
                article
            );
        });

        setupWishlistButtons();
        setupProductLinks();
    }

    function renderAccountWishlistPreview() {
        const container =
            document.querySelector(
                "#account-wishlist-preview"
            );

        if (!container) return;

        const wishlist =
            getStorage(
                WISHLIST_KEY,
                []
            );

        container.innerHTML = "";

        wishlist
            .slice(0, 4)
            .forEach(item => {
                const article =
                    document.createElement(
                        "article"
                    );

                article.className =
                    "product-card";

                article.innerHTML = `
                    <a
                        href="product.html"
                        data-product-link="${item.id}"
                    >
                        <img
                            src="../assets/images/${item.image}"
                            alt="${item.name}"
                        >

                        <h3>${item.name}</h3>

                        <p>${formatPrice(
                            item.price
                        )}</p>
                    </a>
                `;

                container.appendChild(
                    article
                );
            });

        setupProductLinks();
    }

    function setupProductLinks() {
        document.querySelectorAll(
            'a[href="product.html"]'
        ).forEach(link => {
            if (
                link.dataset
                    .productLinkReady ===
                "true"
            ) {
                return;
            }

            link.dataset.productLinkReady =
                "true";

            link.addEventListener(
                "click",
                () => {
                    let product = null;

                    const card =
                        link.closest(
                            ".product-card"
                        );

                    if (card) {
                        product =
                            getCardProduct(
                                card
                            );
                    }

                    if (
                        !product &&
                        link.dataset
                            .productLink
                    ) {
                        product =
                            findProduct(
                                link.dataset
                                    .productLink
                            );
                    }

                    if (product) {
                        setStorage(
                            SELECTED_PRODUCT_KEY,
                            product
                        );
                    }
                }
            );
        });
    }

    function setupShop() {
        const filterButtons =
            document.querySelectorAll(
                ".filter-button[data-category]"
            );

        const sortSelect =
            document.querySelector(
                "#sort-products"
            );

        const productGrid =
            document.querySelector(
                ".shop-products .product-grid"
            );

        if (!productGrid) return;

        productGrid.innerHTML = "";

        products.forEach(product => {
            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "product-card";

            const category =
                product.category === "rings" ||
                product.category === "necklaces" ||
                product.category === "earrings" ||
                product.category === "bracelets"
                    ? `${product.category} jewelry`
                    : product.category;

            article.dataset.category =
                category;

            article.innerHTML = `
                <a
                    href="product.html"
                    data-product-link="${product.id}"
                >

                    <div class="product-image">

                        <img
                            src="../assets/images/${product.image}"
                            alt="${product.name}"
                        >

                        <button
                            class="wishlist-button"
                            type="button"
                            data-product-id="${product.id}"
                            aria-label="Add ${product.name} to wishlist"
                        >
                            ♡
                        </button>

                    </div>

                    <div class="product-info">

                        <h2>
                            ${product.name}
                        </h2>

                        <p>
                            ${formatPrice(product.price)}
                        </p>

                    </div>

                </a>
            `;

            productGrid.appendChild(
                article
            );
        });

        setupWishlistButtons();
        setupProductLinks();

        const originalOrder =
            Array.from(
                productGrid.querySelectorAll(
                    ".product-card"
                )
            );

        let activeCategory =
            "all";

        function applyShop() {
            let visibleCards =
                originalOrder.filter(
                    card => {
                        if (
                            activeCategory ===
                            "all"
                        ) {
                            return true;
                        }

                        const categories =
                            (
                                card.dataset
                                    .category ||
                                ""
                            )
                                .split(/\s+/)
                                .filter(
                                    Boolean
                                );

                        return categories.includes(
                            activeCategory
                        );
                    }
                );

            if (sortSelect) {
                const sort =
                    sortSelect.value;

                if (
                    sort ===
                    "price-low"
                ) {
                    visibleCards.sort(
                        (a, b) => {
                            return (
                                getCardProduct(
                                    a
                                ).price -
                                getCardProduct(
                                    b
                                ).price
                            );
                        }
                    );
                }

                if (
                    sort ===
                    "price-high"
                ) {
                    visibleCards.sort(
                        (a, b) => {
                            return (
                                getCardProduct(
                                    b
                                ).price -
                                getCardProduct(
                                    a
                                ).price
                            );
                        }
                    );
                }

                if (
                    sort ===
                    "newest"
                ) {
                    visibleCards.reverse();
                }
            }

            visibleCards.forEach(
                card => {
                    productGrid.appendChild(
                        card
                    );
                }
            );

            originalOrder.forEach(
                card => {
                    card.hidden =
                        !visibleCards.includes(
                            card
                        );
                }
            );
        }

        filterButtons.forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        filterButtons.forEach(
                            item => {
                                item.classList.remove(
                                    "active"
                                );
                            }
                        );

                        button.classList.add(
                            "active"
                        );

                        activeCategory =
                            button.dataset
                                .category;

                        applyShop();
                    }
                );
            }
        );

        if (sortSelect) {
            sortSelect.addEventListener(
                "change",
                applyShop
            );
        }

        applyShop();
    }

    function setupMobileMenu() {
        const menuButtons =
            document.querySelectorAll(
                ".menu-toggle, .mobile-menu-toggle, [data-menu-toggle]"
            );

        if (!menuButtons.length) return;

        menuButtons.forEach(button => {
            if (
                button.dataset.menuReady ===
                "true"
            ) {
                return;
            }

            button.dataset.menuReady =
                "true";

            const header =
                button.closest(".site-header");

            const mobileMenu =
                header?.querySelector(
                    ".mobile-menu"
                );

            if (!mobileMenu) {
                return;
            }

            mobileMenu.classList.remove(
                "is-open"
            );

            mobileMenu.setAttribute(
                "aria-hidden",
                "true"
            );

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.classList.remove(
                "is-open"
            );

            button.addEventListener(
                "click",
                () => {
                    const isOpen =
                        mobileMenu.classList.contains(
                            "is-open"
                        );

                    if (isOpen) {
                        mobileMenu.classList.remove(
                            "is-open"
                        );

                        mobileMenu.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        button.classList.remove(
                            "is-open"
                        );
                    } else {
                        mobileMenu.classList.add(
                            "is-open"
                        );

                        mobileMenu.setAttribute(
                            "aria-hidden",
                            "false"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "true"
                        );

                        button.classList.add(
                            "is-open"
                        );
                    }
                }
            );

            mobileMenu
                .querySelectorAll(
                    ".mobile-nav a"
                )
                .forEach(link => {
                    link.addEventListener(
                        "click",
                        () => {
                            mobileMenu.classList.remove(
                                "is-open"
                            );

                            mobileMenu.setAttribute(
                                "aria-hidden",
                                "true"
                            );

                            button.classList.remove(
                                "is-open"
                            );

                            button.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    );
                });
        });
    }

    function setupCheckout() {
        const checkoutForm =
            document.querySelector(
                "#checkout-form"
            );

        if (!checkoutForm) return;

        renderCheckoutSummary();

        const deliveryOptions =
            document.querySelectorAll(
                'input[name="delivery"]'
            );

        deliveryOptions.forEach(
            option => {
                option.addEventListener(
                    "change",
                    renderCheckoutSummary
                );
            }
        );

        checkoutForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const currentAccount =
                    getStorage(
                        ACCOUNT_KEY,
                        {}
                    );

                if (
                    currentAccount.loggedIn !== true ||
                    !currentAccount.id
                ) {
                    alert(
                        "Please sign in or create a DREWANE account before placing your order."
                    );

                    window.location.href =
                        "account.html";

                    return;
                }

                const cart =
                    getStorage(
                        CART_KEY,
                        []
                    );

                if (!cart.length) {
                    window.location.href =
                        "cart.html";

                    return;
                }

                const requiredFields =
                    document.querySelectorAll(
                        ".checkout-page input[required], .checkout-page select[required], .checkout-page textarea[required]"
                    );

                let valid = true;

                for (
                    const field
                    of requiredFields
                ) {
                    if (
                        !field.value.trim()
                    ) {
                        field.focus();

                        valid = false;

                        break;
                    }

                    if (
                        field.type ===
                            "email" &&
                        !field.checkValidity()
                    ) {
                        field.focus();

                        valid = false;

                        break;
                    }
                }

                if (!valid) return;

                const email =
                    document.querySelector(
                        "#email"
                    )?.value.trim();

                const selectedDelivery =
                    document.querySelector(
                        'input[name="delivery"]:checked'
                    );

                const delivery =
                    selectedDelivery
                        ? selectedDelivery.value
                        : "standard";

                try {
                    const response =
                        await fetch(
                            "/api/payments/initialize",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify({
                                        email,
                                        delivery
                                    })
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        alert(
                            data.error ||
                            "Unable to initialize payment."
                        );

                        return;
                    }

                    if (
                        !data.access_code
                    ) {
                        alert(
                            "Unable to start Paystack payment."
                        );

                        return;
                    }

                    if (
                        typeof PaystackPop !==
                        "function"
                    ) {
                        alert(
                            "Paystack could not be loaded."
                        );

                        return;
                    }

                    const popup =
                        new PaystackPop();

                    popup.resumeTransaction(
                        data.access_code,
                        {
                            async onSuccess(transaction) {
                                try {
                                    const verificationResponse =
                                        await fetch(
                                            `/api/payments/verify/${encodeURIComponent(transaction.reference)}?delivery=${encodeURIComponent(delivery)}`
                                        );

                                    const verificationData =
                                        await verificationResponse.json();

                                    if (
                                        !verificationResponse.ok ||
                                        !verificationData.success
                                    ) {
                                        alert(
                                            verificationData.error ||
                                            "Unable to verify payment."
                                        );

                                        return;
                                    }

                                    const totals =
                                        getCheckoutTotals();

                                    const order = {
                                        orderNumber:
                                            createOrderNumber(),
                                        items:
                                            cart,
                                        subtotal:
                                            totals.subtotal,
                                        shipping:
                                            totals.shipping,
                                        tax:
                                            totals.tax,
                                        total:
                                            totals.total
                                    };

                                    setStorage(
                                        LAST_ORDER_KEY,
                                        order
                                    );

                                    await clearCart();

                                    updateCartCount();

                                    window.location.href =
                                        "success.html";
                                } catch (error) {
                                    console.error(
                                        error
                                    );

                                    alert(
                                        "Unable to verify payment."
                                    );
                                }
                            },

                            onCancel() {
                            },

                            onError(error) {
                                console.error(
                                    error
                                );

                                alert(
                                    "Payment could not be completed."
                                );
                            }
                        }
                    );
                } catch (error) {
                    console.error(error);

                    alert(
                        "Unable to connect to the payment server."
                    );
                }
            }
        );
    }

    function getCheckoutTotals() {
        const cart =
            getStorage(
                CART_KEY,
                []
            );

        const subtotal =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.price
                    ) *
                    Number(
                        item.quantity
                    ),
                0
            );

        const selectedDelivery =
            document.querySelector(
                'input[name="delivery"]:checked'
            );

        let shipping = cart.length ? 0 : 0;

        if (
            cart.length &&
            selectedDelivery &&
            selectedDelivery.value ===
                "express"
        ) {
            shipping = 25;
        }

        const tax =
            (subtotal + shipping) * 0.075;

        return {
            subtotal,
            shipping,
            tax,
            total:
                subtotal +
                shipping +
                tax
        };
    }

    function renderCheckoutSummary() {
        const container =
            document.querySelector(
                "#checkout-products"
            );

        if (!container) return;

        const cart =
            getStorage(
                CART_KEY,
                []
            );

        container.innerHTML = "";

        cart.forEach(item => {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "checkout-product";

            row.innerHTML = `
                <div>
                    <span>${item.name}</span>
                    <span>× ${item.quantity}</span>
                </div>

                <strong>
                    ${formatPrice(
                        item.price *
                        item.quantity
                    )}
                </strong>
            `;

            container.appendChild(
                row
            );
        });

        const totals =
            getCheckoutTotals();

        const subtotal =
            document.querySelector(
                "#checkout-subtotal"
            );

        const shipping =
            document.querySelector(
                "#checkout-shipping"
            );

        const tax =
            document.querySelector(
                "#checkout-tax"
            );

        const total =
            document.querySelector(
                "#checkout-total"
            );

        if (subtotal) {
            subtotal.textContent =
                formatPrice(
                    totals.subtotal
                );
        }

        if (shipping) {
            shipping.textContent =
                formatPrice(
                    totals.shipping
                );
        }

        if (tax) {
            tax.textContent =
                formatPrice(
                    totals.tax
                );
        }

        if (total) {
            total.textContent =
                formatPrice(
                    totals.total
                );
        }
    }

    function createOrderNumber() {
        const date =
            new Date();

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        const random =
            Math.floor(
                1000 +
                Math.random() *
                9000
            );

        return `DRW-${year}${month}${day}-${random}`;
    }

    function setupSuccessPage() {
        const orderNumber =
            document.querySelector(
                "#order-number"
            );

        if (!orderNumber) return;

        const order =
            getStorage(
                LAST_ORDER_KEY,
                null
            );

        if (!order) return;

        orderNumber.textContent =
            order.orderNumber;

        const container =
            document.querySelector(
                "#success-products"
            );

        if (container) {
            container.innerHTML = "";

            order.items.forEach(
                item => {
                    const row =
                        document.createElement(
                            "div"
                        );

                    row.className =
                        "success-product";

                    row.innerHTML = `
                        <div>
                            <span>${item.name}</span>
                            <span>× ${item.quantity}</span>
                        </div>

                        <strong>
                            ${formatPrice(
                                item.price *
                                item.quantity
                            )}
                        </strong>
                    `;

                    container.appendChild(
                        row
                    );
                }
            );
        }

        const subtotal =
            document.querySelector(
                "#success-subtotal"
            );

        const shipping =
            document.querySelector(
                "#success-shipping"
            );

        const total =
            document.querySelector(
                "#success-total"
            );

        if (subtotal) {
            subtotal.textContent =
                formatPrice(
                    order.subtotal
                );
        }

        if (shipping) {
            shipping.textContent =
                formatPrice(
                    order.shipping
                );
        }

        if (total) {
            total.textContent =
                formatPrice(
                    order.total
                );
        }
    }

    function setupAccount() {
        const accountPage =
            document.querySelector(
                ".customer-page"
            );

        if (!accountPage) return;

        const tabButtons =
            document.querySelectorAll(
                "[data-account-tab]"
            );

        const panels =
            document.querySelectorAll(
                "[data-account-panel]"
            );

        const auth =
            document.querySelector(
                "#account-auth"
            );

        const authInner =
            document.querySelector(
                ".account-auth-inner"
            );

        function activateTab(tabName) {
            tabButtons.forEach(
                button => {
                    button.classList.toggle(
                        "active",
                        button.dataset
                            .accountTab ===
                            tabName
                    );
                }
            );

            panels.forEach(
                panel => {
                    const isActive =
                        panel.dataset
                            .accountPanel ===
                        tabName;

                    panel.classList.toggle(
                        "active",
                        isActive
                    );

                    panel.hidden =
                        !isActive;
                }
            );
        }

        function showAccount() {
            if (auth) {
                auth.hidden = true;
            }

            accountPage
                .querySelector(
                    ".account-section"
                )
                ?.removeAttribute(
                    "hidden"
                );

            activateTab("overview");
            updateAccountDisplay();
            renderAccountWishlistPreview();
        }

        function showAuth() {
            if (auth) {
                auth.hidden = false;
            }

            accountPage
                .querySelector(
                    ".account-section"
                )
                ?.setAttribute(
                    "hidden",
                    ""
                );
        }

        function redirectToCheckoutIfNeeded() {
            const params =
                new URLSearchParams(
                    window.location.search
                );

            if (
                params.get("return") ===
                "checkout"
            ) {
                window.location.href =
                    "checkout.html";

                return true;
            }

            return false;
        }

        function setupPasswordVisibility() {
            document.querySelectorAll(
                'input[type="password"]'
            ).forEach(input => {
                if (
                    input.dataset
                        .passwordVisibilityReady ===
                    "true"
                ) {
                    return;
                }

                input.dataset
                    .passwordVisibilityReady =
                    "true";

                const toggle =
                    document.createElement(
                        "button"
                    );

                toggle.type =
                    "button";

                toggle.className =
                    "text-button";

                toggle.textContent =
                    "Show";

                toggle.style.marginTop =
                    "4px";

                toggle.style.alignSelf =
                    "flex-start";

                toggle.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        const visible =
                            input.type ===
                            "text";

                        input.type =
                            visible
                                ? "password"
                                : "text";

                        toggle.textContent =
                            visible
                                ? "Show"
                                : "Hide";
                    }
                );

                input.insertAdjacentElement(
                    "afterend",
                    toggle
                );
            });
        }

        function setupRegistrationForm() {
            if (!authInner) return;

            authInner.innerHTML = `
                <p class="eyebrow">
                    MY ACCOUNT
                </p>

                <h1>
                    Create your account.
                </h1>

                <p>
                    Create a DREWANE account to manage your orders,
                    saved pieces, and personal details.
                </p>

                <form
                    class="account-login-form"
                    id="account-register-form"
                >

                    <div class="form-field">
                        <label for="register-name">
                            Full name
                        </label>

                        <input
                            type="text"
                            id="register-name"
                            name="name"
                            autocomplete="name"
                            required
                        >
                    </div>

                    <div class="form-field">
                        <label for="register-email">
                            Email address
                        </label>

                        <input
                            type="email"
                            id="register-email"
                            name="email"
                            autocomplete="email"
                            required
                        >
                    </div>

                    <div class="form-field">
                        <label for="register-phone">
                            Phone number
                        </label>

                        <input
                            type="tel"
                            id="register-phone"
                            name="phone"
                            autocomplete="tel"
                            required
                        >
                    </div>

                    <div class="form-field">
                        <label for="register-password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="register-password"
                            name="password"
                            autocomplete="new-password"
                            required
                        >
                    </div>

                    <div class="form-field">
                        <label for="register-confirm-password">
                            Confirm password
                        </label>

                        <input
                            type="password"
                            id="register-confirm-password"
                            name="confirmPassword"
                            autocomplete="new-password"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="button"
                    >
                        Create Account
                    </button>

                </form>

                <p class="account-create">
                    Already have an account?

                    <a
                        href="#"
                        id="show-login"
                    >
                        Sign In
                    </a>
                </p>
            `;

            const registerForm =
                document.querySelector(
                    "#account-register-form"
                );

            if (!registerForm) return;

            registerForm.addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    if (
                        !registerForm.checkValidity()
                    ) {
                        registerForm.reportValidity();
                        return;
                    }

                    const formData =
                        new FormData(
                            registerForm
                        );

                    const name =
                        String(
                            formData.get(
                                "name"
                            ) || ""
                        ).trim();

                    const email =
                        String(
                            formData.get(
                                "email"
                            ) || ""
                        ).trim()
                            .toLowerCase();

                    const phone =
                        String(
                            formData.get(
                                "phone"
                            ) || ""
                        ).trim();

                    const password =
                        String(
                            formData.get(
                                "password"
                            ) || ""
                        );

                    const confirmPassword =
                        String(
                            formData.get(
                                "confirmPassword"
                            ) || ""
                        );

                    if (
                        password !==
                        confirmPassword
                    ) {
                        alert(
                            "Passwords do not match."
                        );

                        return;
                    }

                    try {
                        const response =
                            await fetch(
                                "/api/account/register",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body:
                                        JSON.stringify({
                                            name,
                                            email,
                                            phone,
                                            password
                                        })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            alert(
                                data.error ||
                                "Unable to create account."
                            );

                            return;
                        }

                        setStorage(
                            ACCOUNT_KEY,
                            {
                                id:
                                    data.user.id,
                                name:
                                    data.user.name,
                                email:
                                    data.user.email,
                                phone:
                                    data.user.phone,
                                loggedIn:
                                    true
                            }
                        );

                        updateAccountDisplay();

                        if (
                            redirectToCheckoutIfNeeded()
                        ) {
                            return;
                        }

                        showAccount();
                    } catch (error) {
                        console.error(error);

                        alert(
                            "Unable to connect to the account server."
                        );
                    }
                }
            );

            setupPasswordVisibility();

            const showLogin =
                document.querySelector(
                    "#show-login"
                );

            if (showLogin) {
                showLogin.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        setupLoginForm();
                    }
                );
            }
        }

        function setupLoginForm() {
            if (!authInner) return;

            authInner.innerHTML = `
                <p class="eyebrow">
                    MY ACCOUNT
                </p>

                <h1>
                    Welcome back.
                </h1>

                <p>
                    Sign in to view your orders, saved pieces,
                    and account details.
                </p>

                <form
                    class="account-login-form"
                    id="account-login-form"
                >

                    <div class="form-field">
                        <label for="login-email">
                            Email address
                        </label>

                        <input
                            type="email"
                            id="login-email"
                            name="email"
                            autocomplete="email"
                            required
                        >
                    </div>

                    <div class="form-field">
                        <label for="login-password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="login-password"
                            name="password"
                            autocomplete="current-password"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="button"
                    >
                        Sign In
                    </button>

                </form>

                <a
                    href="#"
                    class="text-link"
                    id="forgot-password"
                >
                    Forgot Password?
                </a>

                <p class="account-create">
                    Don't have an account?

                    <a
                        href="#"
                        id="show-register"
                    >
                        Create Account
                    </a>
                </p>
            `;

            const loginForm =
                document.querySelector(
                    "#account-login-form"
                );

            if (loginForm) {
                loginForm.addEventListener(
                    "submit",
                    async event => {
                        event.preventDefault();

                        if (
                            !loginForm.checkValidity()
                        ) {
                            loginForm.reportValidity();
                            return;
                        }

                        const email =
                            loginForm
                                .querySelector(
                                    'input[name="email"]'
                                )
                                ?.value.trim()
                                .toLowerCase();

                        const password =
                            loginForm
                                .querySelector(
                                    'input[name="password"]'
                                )
                                ?.value || "";

                        try {
                            const response =
                                await fetch(
                                    "/api/account/login",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },
                                        body:
                                            JSON.stringify({
                                                email,
                                                password
                                            })
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                alert(
                                    data.error ||
                                    "The email address or password is incorrect."
                                );

                                return;
                            }

                            setStorage(
                                ACCOUNT_KEY,
                                {
                                    id:
                                        data.user.id,
                                    name:
                                        data.user.name,
                                    email:
                                        data.user.email,
                                    phone:
                                        data.user.phone,
                                    loggedIn:
                                        true
                                }
                            );

                            updateAccountDisplay();

                            if (
                                redirectToCheckoutIfNeeded()
                            ) {
                                return;
                            }

                            showAccount();
                        } catch (error) {
                            console.error(error);

                            alert(
                                "Unable to connect to the account server."
                            );
                        }
                    }
                );
            }

            setupPasswordVisibility();

            const showRegister =
                document.querySelector(
                    "#show-register"
                );

            if (showRegister) {
                showRegister.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        setupRegistrationForm();
                    }
                );
            }

            const forgotPassword =
                document.querySelector(
                    "#forgot-password"
                );

            if (forgotPassword) {
                forgotPassword.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        alert(
                            "Password recovery will be available once DREWANE has a connected account server."
                        );
                    }
                );
            }
        }

        tabButtons.forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        activateTab(
                            button.dataset
                                .accountTab
                        );
                    }
                );
            }
        );

        document.querySelectorAll(
            "[data-account-tab-link]"
        ).forEach(link => {
            link.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    activateTab(
                        link.dataset
                            .accountTabLink
                    );
                }
            );
        });

        const detailsForm =
            document.querySelector(
                "#account-details-form"
            );

        if (detailsForm) {
            detailsForm.addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    const currentAccount =
                        getStorage(
                            ACCOUNT_KEY,
                            {}
                        );

                    if (!currentAccount.id) {
                        showAuth();
                        setupLoginForm();

                        return;
                    }

                    const formData =
                        new FormData(
                            detailsForm
                        );

                    const name =
                        String(
                            formData.get(
                                "name"
                            ) ||
                            ""
                        ).trim();

                    const email =
                        String(
                            formData.get(
                                "email"
                            ) ||
                            ""
                        ).trim()
                            .toLowerCase();

                    const phone =
                        String(
                            formData.get(
                                "phone"
                            ) ||
                            ""
                        ).trim();

                    try {
                        const response =
                            await fetch(
                                `/api/account/${currentAccount.id}`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body:
                                        JSON.stringify({
                                            name,
                                            email,
                                            phone
                                        })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            alert(
                                data.error ||
                                "Unable to save account details."
                            );

                            return;
                        }

                        setStorage(
                            ACCOUNT_KEY,
                            {
                                id:
                                    data.user.id,
                                name:
                                    data.user.name,
                                email:
                                    data.user.email,
                                phone:
                                    data.user.phone,
                                loggedIn:
                                    true
                            }
                        );

                        updateAccountDisplay();
                        activateTab("overview");

                        const submitButton =
                            detailsForm.querySelector(
                                'button[type="submit"]'
                            );

                        if (submitButton) {
                            const original =
                                submitButton.textContent;

                            submitButton.textContent =
                                "Saved";

                            setTimeout(
                                () => {
                                    submitButton.textContent =
                                        original;
                                },
                                1500
                            );
                        }
                    } catch (error) {
                        console.error(error);

                        alert(
                            "Unable to connect to the account server."
                        );
                    }
                }
            );
        }

        function signOutAccount(event) {
            event.preventDefault();

            const currentAccount =
                getStorage(
                    ACCOUNT_KEY,
                    {}
                );

            currentAccount.loggedIn =
                false;

            setStorage(
                ACCOUNT_KEY,
                currentAccount
            );

            showAuth();
            setupLoginForm();
        }

        document.querySelectorAll(
            "#account-signout, [data-account-signout-action]"
        ).forEach(signout => {
            signout.addEventListener(
                "click",
                signOutAccount
            );
        });

        const currentAccount =
            getStorage(
                ACCOUNT_KEY,
                {}
            );

        if (
            currentAccount.loggedIn === true &&
            currentAccount.id
        ) {
            if (
                redirectToCheckoutIfNeeded()
            ) {
                return;
            }

            showAccount();
        } else {
            showAuth();
            setupLoginForm();
        }
    }

    function updateAccountDisplay() {
        const account =
            getStorage(
                ACCOUNT_KEY,
                {}
            );

        const name =
            account.name || "";

        const email =
            account.email || "";

        const phone =
            account.phone || "";

        document.querySelectorAll(
            "#account-name"
        ).forEach(element => {
            element.textContent =
                name;
        });

        document.querySelectorAll(
            "#account-email"
        ).forEach(element => {
            element.textContent =
                email;
        });

        document.querySelectorAll(
            "#account-phone"
        ).forEach(element => {
            element.textContent =
                phone;
        });

        const form =
            document.querySelector(
                "#account-details-form"
            );

        if (form) {
            const nameInput =
                form.querySelector(
                    '[name="name"]'
                );

            const emailInput =
                form.querySelector(
                    '[name="email"]'
                );

            const phoneInput =
                form.querySelector(
                    '[name="phone"]'
                );

            if (nameInput) {
                nameInput.value =
                    account.name || "";
            }

            if (emailInput) {
                emailInput.value =
                    account.email || "";
            }

            if (phoneInput) {
                phoneInput.value =
                    account.phone || "";
            }
        }

        const auth =
            document.querySelector(
                "#account-auth"
            );

        if (auth) {
            auth.hidden =
                account.loggedIn === true;
        }
    }

    function setupNewsletter() {
        const forms =
            document.querySelectorAll(
                ".newsletter-form"
            );

        forms.forEach(form => {
            if (
                form.dataset.ready ===
                "true"
            ) {
                return;
            }

            form.dataset.ready =
                "true";

            form.addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const input =
                        form.querySelector(
                            'input[type="email"]'
                        );

                    if (
                        !input ||
                        !input.checkValidity()
                    ) {
                        input?.focus();

                        return;
                    }

                    localStorage.setItem(
                        "drewaneNewsletter",
                        input.value.trim()
                    );

                    const button =
                        form.querySelector(
                            "button"
                        );

                    if (button) {
                        const original =
                            button.textContent;

                        button.textContent =
                            "Subscribed";

                        button.disabled =
                            true;

                        setTimeout(
                            () => {
                                button.textContent =
                                    original;

                                button.disabled =
                                    false;
                            },
                            2000
                        );
                    }
                }
            );
        });
    }

    function setupContactForm() {
        const form =
            document.querySelector(
                "#contact-form"
            );

        if (!form) return;

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                if (
                    !form.checkValidity()
                ) {
                    form.reportValidity();

                    return;
                }

                const button =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (button) {
                    const original =
                        button.textContent;

                    button.textContent =
                        "Message Sent";

                    button.disabled =
                        true;

                    setTimeout(
                        () => {
                            form.reset();

                            button.textContent =
                                original;

                            button.disabled =
                                false;
                        },
                        2000
                    );
                }
            }
        );
    }

    function setupCollectionCards() {
        document.querySelectorAll(
            ".product-card"
        ).forEach(card => {
            const product =
                getCardProduct(card);

            if (!product) return;

            const wishlistButton =
                card.querySelector(
                    ".wishlist-button, .product-wishlist, [data-wishlist]"
                );

            if (wishlistButton) {
                wishlistButton.dataset.productId =
                    product.id;
            }
        });
    }

    try {
        await loadProducts();
    } catch (error) {
        console.error(error);
    }

    setupHeroSlider();
    setupProductSliders();
    setupMobileMenu();
    setupWishlistButtons();
    setupProductLinks();
    setupCollectionCards();
    setupProductPage();
    setupShop();
    renderCart();
    renderWishlist();
    renderAccountWishlistPreview();
    setupCheckout();
    setupSuccessPage();
    setupAccount();
    setupNewsletter();
    setupContactForm();
    updateCartCount();
});